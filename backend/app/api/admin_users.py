from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from app.core.database import get_db
from app.core.security import RequirePermission, hash_password
from app.models.user import User
from app.models.role import Role
import uuid
import logging
from datetime import datetime, timezone, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

RESET_TOKEN_HOURS = 48

def invite_url(token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/admin/accept-invitation/{token}"

def reset_url(token: str) -> str:
    return f"{settings.FRONTEND_URL.rstrip('/')}/admin/reset-password/{token}"

class RoleResponse(BaseModel):
    id: str
    name: str
    description: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    status: str
    role_id: str
    role_name: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    invite_token: Optional[str] = None
    invite_link: Optional[str] = None

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None
    role_id: str

class UserUpdate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    phone: Optional[str] = None

@router.get("/roles", response_model=List[RoleResponse])
async def list_roles(db: AsyncSession = Depends(get_db), user = Depends(RequirePermission("users.view"))):
    result = await db.execute(select(Role).order_by(Role.name))
    return result.scalars().all()

@router.get("/", response_model=List[UserResponse])
async def list_users(db: AsyncSession = Depends(get_db), user = Depends(RequirePermission("users.view"))):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    # Fetch roles to attach role_name
    roles_result = await db.execute(select(Role))
    roles = {r.id: r.name for r in roles_result.scalars().all()}
    
    response = []
    for u in users:
        # Split name for ease if needed
        u_dict = {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "phone": u.phone,
            "status": u.status,
            "role_id": u.role_id,
            "role_name": roles.get(u.role_id, "Unknown"),
            "created_at": u.created_at,
            "last_login_at": u.last_login_at,
            "invite_token": u.invite_token if u.status == "Pending" else None,
            "invite_link": invite_url(u.invite_token) if u.status == "Pending" and u.invite_token else None,
        }
        response.append(u_dict)
    return response

@router.post("/", response_model=UserResponse)
async def create_user(data: UserCreate, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.create"))):
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="An administrator with this email already exists.")
        
    # Check role exists
    role_result = await db.execute(select(Role).where(Role.id == data.role_id))
    role = role_result.scalars().first()
    if not role:
        raise HTTPException(status_code=400, detail="Invalid role selected.")
        
    invite_token = str(uuid.uuid4())
    
    new_user = User(
        email=data.email,
        name=f"{data.first_name} {data.last_name}",
        phone=data.phone,
        status="Pending",
        role_id=data.role_id,
        invite_token=invite_token
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    link = invite_url(invite_token)
    logger.info("Invitation link for %s: %s", data.email, link)
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "phone": new_user.phone,
        "status": new_user.status,
        "role_id": new_user.role_id,
        "role_name": role.name,
        "created_at": new_user.created_at,
        "last_login_at": new_user.last_login_at,
        "invite_token": invite_token,
        "invite_link": link,
    }

async def ensure_not_last_super_admin(user_to_check: User, db: AsyncSession):
    role_res = await db.execute(select(Role).where(Role.id == user_to_check.role_id))
    role = role_res.scalars().first()
    if role and role.name == "Super Administrator":
        # Check how many active super admins exist
        count_res = await db.execute(
            select(User).where(User.role_id == role.id, User.status == 'Active')
        )
        active_supers = count_res.scalars().all()
        if len(active_supers) <= 1:
            raise HTTPException(status_code=400, detail="You cannot remove, deactivate, or change the role of the last active Super Administrator.")

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, data: UserUpdate, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.edit"))):
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.email != data.email:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Email already in use.")
            
    target_user.name = f"{data.first_name} {data.last_name}"
    target_user.email = data.email
    target_user.phone = data.phone
    
    await db.commit()
    await db.refresh(target_user)
    
    role_res = await db.execute(select(Role).where(Role.id == target_user.role_id))
    role = role_res.scalars().first()
    
    return {
        "id": target_user.id,
        "email": target_user.email,
        "name": target_user.name,
        "phone": target_user.phone,
        "status": target_user.status,
        "role_id": target_user.role_id,
        "role_name": role.name if role else "Unknown",
        "created_at": target_user.created_at,
        "last_login_at": target_user.last_login_at
    }

@router.patch("/{user_id}/status")
async def change_status(user_id: str, status: dict, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.activate"))):
    new_status = status.get("status")
    if new_status not in ["Active", "Inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if new_status == "Inactive":
        await ensure_not_last_super_admin(target_user, db)
        
    target_user.status = new_status
    await db.commit()
    return {"message": "Status updated successfully"}

@router.patch("/{user_id}/role")
async def change_role(user_id: str, role_data: dict, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.edit"))):
    new_role_id = role_data.get("role_id")
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    role_res = await db.execute(select(Role).where(Role.id == new_role_id))
    if not role_res.scalars().first():
        raise HTTPException(status_code=400, detail="Invalid role selected")
        
    await ensure_not_last_super_admin(target_user, db)
    
    target_user.role_id = new_role_id
    await db.commit()
    return {"message": "Role updated successfully"}

@router.delete("/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.delete"))):
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    await ensure_not_last_super_admin(target_user, db)
    
    # Soft deletion not explicitly modeled, but we'll do hard delete for now
    await db.delete(target_user)
    await db.commit()
    return {"message": "Administrator deleted successfully"}

@router.post("/{user_id}/resend-invitation")
async def resend_invitation(user_id: str, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.create"))):
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.status != "Pending":
        raise HTTPException(status_code=400, detail="Only pending administrators can receive a new invitation.")

    invite_token = str(uuid.uuid4())
    target_user.invite_token = invite_token
    await db.commit()
    link = invite_url(invite_token)
    logger.info("Invitation link for %s: %s", target_user.email, link)
    return {"invite_token": invite_token, "invite_link": link}

@router.post("/{user_id}/reset-password")
async def start_password_reset(user_id: str, db: AsyncSession = Depends(get_db), admin = Depends(RequirePermission("users.reset_password"))):
    result = await db.execute(select(User).where(User.id == user_id))
    target_user = result.scalars().first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    if target_user.status != "Active":
        raise HTTPException(status_code=400, detail="A reset link can only be created for an active administrator.")

    reset_token = str(uuid.uuid4())
    target_user.reset_token = reset_token
    target_user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=RESET_TOKEN_HOURS)
    await db.commit()
    link = reset_url(reset_token)
    logger.info("Password reset link for %s: %s", target_user.email, link)
    return {"reset_token": reset_token, "reset_link": link, "expires_in_hours": RESET_TOKEN_HOURS}

class AcceptInvite(BaseModel):
    token: str
    password: str

@router.post("/accept-invitation")
async def accept_invitation(data: AcceptInvite, db: AsyncSession = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.invite_token == data.token))
    target_user = result.scalars().first()
    
    if not target_user:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token.")
        
    target_user.password_hash = hash_password(data.password)
    target_user.status = "Active"
    target_user.invite_token = None
    
    await db.commit()
    return {"message": "Password created and account activated successfully."}

@router.post("/reset-password")
async def complete_password_reset(data: AcceptInvite, db: AsyncSession = Depends(get_db)):
    if len(data.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    result = await db.execute(select(User).where(User.reset_token == data.token))
    target_user = result.scalars().first()
    if not target_user or not target_user.reset_token_expires:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    expires = target_user.reset_token_expires
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    target_user.password_hash = hash_password(data.password)
    target_user.reset_token = None
    target_user.reset_token_expires = None
    await db.commit()
    return {"message": "Password updated successfully."}
