import asyncio
import uuid
from datetime import datetime, timezone
import bcrypt
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.role import Role

ADMINS = [
    {
        "email": "admin@3mservice.shop",
        "name": "Direction 3M SERVICES",
        "password": "3MServices@2025!",
    },
    {
        "email": "contact@3mservice.shop",
        "name": "Support 3M SERVICES",
        "password": "3MServices@2025!",
    },
    {
        "email": "ajana@3mservice.shop",
        "name": "A. Jana Admin",
        "password": "Capentrepreneurs@2026",
    },
]

async def seed():
    async with AsyncSessionLocal() as db:
        # 1. Ensure Super Administrator role exists
        res = await db.execute(select(Role).where(Role.name == "Super Administrator"))
        role = res.scalars().first()
        now = datetime.now(timezone.utc)
        
        if not role:
            role = Role(
                id=str(uuid.uuid4()),
                name="Super Administrator",
                description="Full access to all modules and showroom catalogue",
                permissions=["*"],
                created_at=now,
                updated_at=now,
            )
            db.add(role)
            await db.commit()
            await db.refresh(role)
            print(f"Created role: {role.name} ({role.id})")
        else:
            print(f"Role already exists: {role.name} ({role.id})")

        # 2. Seed Admin Users
        for item in ADMINS:
            email = item["email"].lower().strip()
            pw_hash = bcrypt.hashpw(item["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            user_res = await db.execute(select(User).where(User.email == email))
            user = user_res.scalars().first()
            
            if user:
                user.name = item["name"]
                user.password_hash = pw_hash
                user.role_id = role.id
                user.status = "Active"
                user.updated_at = now
                print(f"Updated admin: {email}")
            else:
                user = User(
                    id=str(uuid.uuid4()),
                    email=email,
                    name=item["name"],
                    password_hash=pw_hash,
                    role_id=role.id,
                    status="Active",
                    created_at=now,
                    updated_at=now,
                )
                db.add(user)
                print(f"Created admin: {email}")

        await db.commit()
        print("All admin accounts successfully seeded!")

if __name__ == "__main__":
    asyncio.run(seed())
