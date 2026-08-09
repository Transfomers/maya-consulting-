from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.submission import SubmissionInput
from app.models.submission import Submission
from typing import Optional

router = APIRouter()

ALLOWED_SUBMISSION_TYPES = {"pledge", "membership", "application", "partner", "volunteer", "contact"}

@router.post("/")
async def create_submission(input: SubmissionInput, db: AsyncSession = Depends(get_db)):
    form_type = input.type.strip().lower()
    if form_type not in ALLOWED_SUBMISSION_TYPES:
        raise HTTPException(status_code=422, detail="Unknown submission type")
        
    payload = {k: (v.strip() if isinstance(v, str) else v) for k, v in input.payload.items()}
    if not payload.get("name") or not payload.get("email"):
        raise HTTPException(status_code=422, detail="Name and email are required")
        
    submission = Submission(type=form_type, payload=payload)
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    return {"ok": True, "id": str(submission.id)}

@router.get("/")
async def list_submissions(type: Optional[str] = None, user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    query = select(Submission).order_by(Submission.created_at.desc())
    if type:
        query = query.where(Submission.type == type)
        
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    return {"submissions": [{"id": s.id, "type": s.type, "payload": s.payload, "created_at": s.created_at} for s in submissions]}
