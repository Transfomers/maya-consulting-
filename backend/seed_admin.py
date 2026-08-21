import asyncio
import bcrypt
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.role import Role
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPER_ADMIN_ROLE_NAME = "Super Administrator"

async def seed_admin():
    async with AsyncSessionLocal() as db:
        email = os.environ.get("ADMIN_EMAIL", "admin@capentrepreneurs.org")
        password = os.environ.get("ADMIN_PASSWORD", "CAP-Admin-2026!")
        
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print("Admin user already exists.")
            return

        role_result = await db.execute(select(Role).where(Role.name == SUPER_ADMIN_ROLE_NAME))
        role = role_result.scalars().first()
        if not role:
            print(f"{SUPER_ADMIN_ROLE_NAME} role is missing — run `alembic upgrade head` first.")
            return

        password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        admin_user = User(
            email=email,
            password_hash=password_hash,
            name="Super Admin",
            status="Active",
            role_id=role.id
        )
        db.add(admin_user)
        await db.commit()
        print(f"Admin user {email} created.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
