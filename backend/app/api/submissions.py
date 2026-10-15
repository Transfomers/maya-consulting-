from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, desc
from app.core.database import get_db
from app.core.security import get_current_user, RequirePermission
from app.schemas.submission import SubmissionInput
from app.models.submission import Submission
from app.models.conversation import ChatConversation
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid

router = APIRouter()

ALLOWED_SUBMISSION_TYPES = {
    "pledge", "membership", "application", "partner", "volunteer", 
    "contact", "newsletter", "review", "program", "join", 
    "buyer", "sourcing", "festival", "festival_sponsor", "press", "donate"
}

@router.post("")
@router.post("/")
async def create_submission(input: SubmissionInput, db: AsyncSession = Depends(get_db)):
    form_type = input.type.strip().lower()
    if form_type not in ALLOWED_SUBMISSION_TYPES:
        raise HTTPException(status_code=422, detail=f"Unknown submission type: {form_type}")
        
    payload = {k: (v.strip() if isinstance(v, str) else v) for k, v in input.payload.items()}
    
    if form_type == "newsletter":
        if not payload.get("email"):
            raise HTTPException(status_code=422, detail="Email is required")
        if not payload.get("name"):
            payload["name"] = payload.get("email").split("@")[0]
    elif form_type == "review":
        if not payload.get("message") and not payload.get("comment") and not payload.get("review"):
            raise HTTPException(status_code=422, detail="Review message is required")
        if not payload.get("name"):
            payload["name"] = "Visiteur"
        if not payload.get("email"):
            payload["email"] = "anonyme@capentrepreneurs.org"
    else:
        if not payload.get("name") or not payload.get("email"):
            raise HTTPException(status_code=422, detail="Name and email are required")
        
    # Ensure default status and conversation notes array
    if "status" not in payload:
        payload["status"] = "new"
    if "notes" not in payload:
        payload["notes"] = []
        
    submission = Submission(type=form_type, payload=payload)
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    
    return {"ok": True, "id": str(submission.id)}

@router.get("/")
async def list_submissions(
    type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    user = Depends(get_current_user), 
    db: AsyncSession = Depends(get_db)
):
    query = select(Submission).order_by(Submission.created_at.desc())
    if type:
        query = query.where(Submission.type == type)
        
    result = await db.execute(query)
    submissions = result.scalars().all()
    
    items = []
    for s in submissions:
        sub_status = s.payload.get("status", "new") if isinstance(s.payload, dict) else "new"
        
        # Filter by status if requested
        if status and sub_status != status:
            continue
            
        # Search in payload
        if search:
            search_lower = search.lower()
            name = str(s.payload.get("name", "")).lower()
            email = str(s.payload.get("email", "")).lower()
            org = str(s.payload.get("organization", s.payload.get("company", ""))).lower()
            msg = str(s.payload.get("message", s.payload.get("goals", ""))).lower()
            if search_lower not in name and search_lower not in email and search_lower not in org and search_lower not in msg and search_lower not in s.type.lower():
                continue
                
        items.append({
            "id": s.id,
            "type": s.type,
            "status": sub_status,
            "payload": s.payload,
            "created_at": s.created_at
        })
        
    return {"submissions": items}

@router.get("/stats")
async def get_submission_stats(user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission))
    all_subs = result.scalars().all()
    
    by_type: Dict[str, int] = {}
    by_status = {"new": 0, "in_review": 0, "contacted": 0, "approved": 0, "archived": 0}
    
    for s in all_subs:
        by_type[s.type] = by_type.get(s.type, 0) + 1
        st = s.payload.get("status", "new") if isinstance(s.payload, dict) else "new"
        by_status[st] = by_status.get(st, 0) + 1
        
    return {
        "total": len(all_subs),
        "by_type": by_type,
        "by_status": by_status
    }

@router.get("/conversations")
async def list_conversations(
    session_id: Optional[str] = None,
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(ChatConversation).order_by(ChatConversation.created_at.desc())
    if session_id:
        query = query.where(ChatConversation.session_id == session_id)
        
    result = await db.execute(query.limit(200))
    messages = result.scalars().all()
    
    # Group by session_id
    sessions_dict: Dict[str, List[Any]] = {}
    for m in messages:
        if m.session_id not in sessions_dict:
            sessions_dict[m.session_id] = []
        sessions_dict[m.session_id].append({
            "id": m.id,
            "sender": m.sender,
            "message": m.message,
            "language": m.language,
            "category": m.category,
            "created_at": m.created_at
        })
        
    return {
        "conversations": [
            {
                "session_id": sid,
                "message_count": len(msgs),
                "last_active": msgs[0]["created_at"] if msgs else None,
                "language": msgs[0]["language"] if msgs else "fr",
                "preview": msgs[0]["message"] if msgs else "",
                "messages": list(reversed(msgs))
            }
            for sid, msgs in sessions_dict.items()
        ]
    }

@router.get("/{id}")
async def get_submission(id: str, user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission).where(Submission.id == id))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {
        "id": submission.id,
        "type": submission.type,
        "status": submission.payload.get("status", "new") if isinstance(submission.payload, dict) else "new",
        "payload": submission.payload,
        "created_at": submission.created_at
    }

@router.put("/{id}")
async def update_submission(
    id: str,
    body: Dict[str, Any],
    user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Submission).where(Submission.id == id))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    current_payload = dict(submission.payload) if isinstance(submission.payload, dict) else {}
    
    # Update status if provided
    if "status" in body:
        current_payload["status"] = body["status"]
        
    # Add note / conversation entry if provided
    if "new_note" in body and body["new_note"].strip():
        notes = list(current_payload.get("notes", []))
        notes.append({
            "id": str(uuid.uuid4()),
            "author": getattr(user, "name", getattr(user, "email", "Admin")),
            "text": body["new_note"].strip(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        current_payload["notes"] = notes
        
    # Merge any other payload updates
    if "payload" in body and isinstance(body["payload"], dict):
        current_payload.update(body["payload"])
        
    submission.payload = current_payload
    await db.commit()
    await db.refresh(submission)
    
    return {
        "id": submission.id,
        "type": submission.type,
        "status": submission.payload.get("status", "new"),
        "payload": submission.payload,
        "created_at": submission.created_at
    }

@router.delete("/{id}")
async def delete_submission(id: str, user = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Submission).where(Submission.id == id))
    submission = result.scalars().first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    await db.delete(submission)
    await db.commit()
    return {"ok": True, "message": "Submission deleted"}
