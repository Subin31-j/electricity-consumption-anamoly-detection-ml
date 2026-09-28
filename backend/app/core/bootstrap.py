"""Bootstrap the development admin user from backend environment configuration.

The admin credentials are read from environment variables (never hardcoded in
frontend code) and stored as a hashed ADMIN user. Idempotent: if the admin
already exists, its role/status are ensured but the password is not overwritten.
"""
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole, UserStatus


def ensure_admin_user(db: Session | None = None) -> None:
    owns_session = db is None
    if db is None:
        db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == settings.ADMIN_EMAIL).first()
        if admin is None:
            admin = User(
                email=settings.ADMIN_EMAIL,
                password_hash=hash_password(settings.ADMIN_PASSWORD),
                name=settings.ADMIN_NAME,
                role=UserRole.ADMIN,
                status=UserStatus.ACTIVE,
            )
            db.add(admin)
            db.commit()
            print(f"[bootstrap] Created admin user: {settings.ADMIN_EMAIL}")
        else:
            changed = False
            if admin.role != UserRole.ADMIN:
                admin.role = UserRole.ADMIN
                changed = True
            if admin.status != UserStatus.ACTIVE:
                admin.status = UserStatus.ACTIVE
                changed = True
            if changed:
                db.commit()
                print(f"[bootstrap] Ensured admin role/status for: {settings.ADMIN_EMAIL}")
            else:
                print(f"[bootstrap] Admin user already present: {settings.ADMIN_EMAIL}")
    finally:
        if owns_session:
            db.close()


if __name__ == "__main__":
    ensure_admin_user()
