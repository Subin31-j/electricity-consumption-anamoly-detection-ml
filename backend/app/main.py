"""FastAPI application entrypoint for the ECAD backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

app = FastAPI(
    title="Electricity Consumption Anomaly Detection API",
    description=(
        "Historical electricity-consumption anomaly detection using machine learning "
        "(Isolation Forest primary; K-Means and LOF for comparison). "
        "This prototype analyzes historical data only and is not connected to a real "
        "electricity board."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _on_startup() -> None:
    """Ensure the bootstrap admin user exists once the DB is reachable."""
    try:
        from app.core.bootstrap import ensure_admin_user
        ensure_admin_user()
    except Exception as exc:  # noqa: BLE001
        print(f"[main] admin bootstrap skipped: {exc}")


@app.get("/health", tags=["system"])
def health() -> dict:
    return {"status": "ok"}


# Routers are registered here. Each wave adds its router; imports are wrapped so a
# not-yet-implemented router does not break app startup during incremental builds.
def _include_routers() -> None:
    try:
        from app.api import auth
        app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] auth router not loaded yet: {exc}")

    try:
        from app.api import consumers
        app.include_router(consumers.router, prefix="/api/consumers", tags=["consumers"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] consumers router not loaded yet: {exc}")

    try:
        from app.api import datasets
        app.include_router(datasets.router, prefix="/api/datasets", tags=["datasets"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] datasets router not loaded yet: {exc}")

    try:
        from app.api import analysis
        app.include_router(analysis.router, prefix="/api", tags=["analysis"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] analysis router not loaded yet: {exc}")

    try:
        from app.api import reports
        app.include_router(reports.router, prefix="/api", tags=["reports"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] reports router not loaded yet: {exc}")

    try:
        from app.api import admin
        app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
    except Exception as exc:  # noqa: BLE001
        print(f"[main] admin router not loaded yet: {exc}")


_include_routers()
