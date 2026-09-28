"""Seed the five fictional demo consumers (with reproducible historical data)
and ensure the bootstrap admin user exists.

Idempotent and safe to run on every container start:
  * missing demo consumers are created;
  * a demo consumer whose stored readings no longer match the current generator
    (different record count or date range) has ONLY its consumption rows
    regenerated -- the consumer row keeps its id and consumer_number;
  * up-to-date consumers are left untouched.

No user accounts, datasets, analyses or reports are ever deleted. Non-demo
consumers (is_demo = False) are never modified.

Usage:
    python -m scripts.seed_demo_consumers            # create + refresh if stale
    python -m scripts.seed_demo_consumers --force    # force regenerate demo data
"""
from __future__ import annotations

import sys

from app.core.bootstrap import ensure_admin_user
from app.db.session import SessionLocal
from app.models.consumer import ElectricityConsumer
from app.models.consumption import ElectricityConsumption
from app.services.demo_data import DEMO_SPECS, DemoConsumerSpec, generate_consumption

BULK_CHUNK = 2000


def _insert_readings(db, consumer_id: int, rows: list[dict]) -> None:
    """Insert consumption rows in chunks. `ground_truth_anomaly` is intentionally
    NOT persisted: the ML models must detect anomalies without labels."""
    for start in range(0, len(rows), BULK_CHUNK):
        chunk = rows[start : start + BULK_CHUNK]
        db.bulk_save_objects(
            [
                ElectricityConsumption(
                    consumer_id=consumer_id,
                    timestamp=r["timestamp"],
                    date=r["timestamp"].date(),
                    time=r["timestamp"].time(),
                    consumption_kwh=r["consumption_kwh"],
                )
                for r in chunk
            ]
        )
        db.flush()


def _apply_metadata(consumer: ElectricityConsumer, spec: DemoConsumerSpec,
                    rows: list[dict]) -> None:
    consumer.consumer_name = spec.consumer_name
    consumer.connection_type = spec.connection_type
    consumer.location = spec.location
    consumer.meter_type = spec.meter_type
    consumer.data_start_date = rows[0]["timestamp"].date()
    consumer.data_end_date = rows[-1]["timestamp"].date()
    consumer.total_records = len(rows)
    consumer.is_demo = True


def seed_consumers(force: bool = False) -> None:
    db = SessionLocal()
    try:
        for spec in DEMO_SPECS:
            existing = (
                db.query(ElectricityConsumer)
                .filter(ElectricityConsumer.consumer_number == spec.consumer_number)
                .first()
            )
            rows = generate_consumption(spec)
            expected_start = rows[0]["timestamp"].date()
            expected_end = rows[-1]["timestamp"].date()

            if existing is None:
                consumer = ElectricityConsumer(
                    consumer_number=spec.consumer_number,
                    email=None,
                )
                _apply_metadata(consumer, spec, rows)
                db.add(consumer)
                db.flush()  # assign consumer.id
                _insert_readings(db, consumer.id, rows)
                db.commit()
                print(
                    f"[seed] Created {spec.consumer_number} ({spec.profile}) "
                    f"with {len(rows):,} readings."
                )
                continue

            if not existing.is_demo:
                print(
                    f"[seed] {spec.consumer_number} exists but is not flagged as demo; "
                    f"leaving it untouched."
                )
                continue

            stored = (
                db.query(ElectricityConsumption)
                .filter(ElectricityConsumption.consumer_id == existing.id)
                .count()
            )
            up_to_date = (
                stored == len(rows)
                and existing.data_start_date == expected_start
                and existing.data_end_date == expected_end
            )
            if up_to_date and not force:
                print(
                    f"[seed] {spec.consumer_number} already up to date "
                    f"({stored:,} readings), skipping."
                )
                continue

            # Refresh only this demo consumer's readings; keep id + consumer_number.
            db.query(ElectricityConsumption).filter(
                ElectricityConsumption.consumer_id == existing.id
            ).delete(synchronize_session=False)
            _apply_metadata(existing, spec, rows)
            _insert_readings(db, existing.id, rows)
            db.commit()
            print(
                f"[seed] Refreshed {spec.consumer_number} ({spec.profile}): "
                f"{stored:,} -> {len(rows):,} readings "
                f"({expected_start} -> {expected_end})."
            )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def main() -> None:
    force = "--force" in sys.argv
    print("[seed] Ensuring admin user...")
    ensure_admin_user()
    print("[seed] Seeding demo consumers...")
    seed_consumers(force=force)
    print("[seed] Done.")


if __name__ == "__main__":
    main()
