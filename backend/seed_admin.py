"""
Seed or update admin accounts.
Run via: docker exec cap_backend python seed_admin.py

Admins defined here are upserted on every deploy so passwords
are always reset to the canonical value even if changed via UI.
"""
import asyncio
import bcrypt
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.role import Role

SUPER_ADMIN_ROLE_NAME = "Super Administrator"

# All three admin accounts - password is set/reset on every deploy
ADMINS = [
    {"email": "ajana@capentrepreneurs.org",     "name": "A. Jana"},
    {"email": "contact@capentrepreneurs.org",   "name": "Contact Admin"},
    {"email": "murielle@capentrepreneurs.org",  "name": "Murielle"},
]

PASSWORD = "Capentreprenurs@2026"


async def seed_admins():
    async with AsyncSessionLocal() as db:
        # Ensure the Super Administrator role exists
        role_result = await db.execute(
            select(Role).where(Role.name == SUPER_ADMIN_ROLE_NAME)
        )
        role = role_result.scalars().first()
        if not role:
            print(
                f"ERROR: '{SUPER_ADMIN_ROLE_NAME}' role not found - "
                "run `alembic upgrade head` first."
            )
            return

        pw_hash = bcrypt.hashpw(
            PASSWORD.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        for admin in ADMINS:
            result = await db.execute(
                select(User).where(User.email == admin["email"])
            )
            user = result.scalars().first()

            if user:
                # Always refresh password + ensure Active status
                user.password_hash = pw_hash
                user.status = "Active"
                user.role_id = role.id
                print(f"  Updated: {admin['email']}")
            else:
                user = User(
                    email=admin["email"],
                    name=admin["name"],
                    password_hash=pw_hash,
                    status="Active",
                    role_id=role.id,
                )
                db.add(user)
                print(f"  Created: {admin['email']}")

        await db.commit()
        print("Done. All admin accounts are ready.")


if __name__ == "__main__":
    asyncio.run(seed_admins())
