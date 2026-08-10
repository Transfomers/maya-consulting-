from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.config import settings
from app.core.security import verify_password, create_access_token, create_refresh_token, get_current_user
from app.schemas.auth import LoginInput
from app.models.user import User

router = APIRouter()

@router.post("/login")
async def login(input: LoginInput, request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    email = input.email.strip().lower()
    
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if not user or not verify_password(input.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Create tokens
    access_token = create_access_token(user_id=user.id, email=user.email, role=user.role)
    refresh_token = create_refresh_token(user_id=user.id)
    
    is_prod = "https" in getattr(settings, "FRONTEND_URL", "")
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=is_prod, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=is_prod, samesite="lax", max_age=604800, path="/")
    
    return {"id": str(user.id), "email": email, "name": user.name, "role": user.role}

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@router.get("/me")
async def me(user = Depends(get_current_user)):
    return {"id": str(user.id), "email": user.email, "name": user.name, "role": user.role}
