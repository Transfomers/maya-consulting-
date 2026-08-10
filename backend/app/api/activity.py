from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
from app.core.database import get_db
from app.core.security import RequireRole
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityLogResponse

router = APIRouter()

@router.get("/", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_id: str = None,
    action: str = None,
    entity_type: str = None,
    user = Depends(RequireRole(["SUPER_ADMIN", "ADMIN"])), 
    db: AsyncSession = Depends(get_db)
):
    query = select(ActivityLog).order_by(desc(ActivityLog.created_at))
    
    if user_id:
        query = query.where(ActivityLog.user_id == user_id)
    if action:
        query = query.where(ActivityLog.action == action)
    if entity_type:
        query = query.where(ActivityLog.entity_type == entity_type)
        
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
