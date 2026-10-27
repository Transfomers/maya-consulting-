import os
import json
import logging
import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Body, UploadFile, File

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "apartments.json")
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

def read_apartments() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {DATA_FILE}: {e}")
        return []

def write_apartments(apartments: List[Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(apartments, f, indent=2, ensure_ascii=False)

@router.post("/upload-photo")
async def upload_apartment_photo(file: UploadFile = File(...)):
    """Upload photo directly from local machine to server uploads folder."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    unique_name = f"apt_{uuid.uuid4().hex[:12]}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        return {"url": f"/uploads/{unique_name}", "filename": unique_name}
    except Exception as e:
        logger.error(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement de l'image.")

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_apartments():
    """Retrieve all apartments in catalogue."""
    return read_apartments()

@router.get("/{apt_id}", response_model=Dict[str, Any])
async def get_apartment_by_id(apt_id: str):
    """Retrieve a single apartment by id."""
    apartments = read_apartments()
    for apt in apartments:
        if str(apt.get("id")) == apt_id:
            return apt
    raise HTTPException(status_code=404, detail="Apartment not found")

@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
async def create_apartment(data: Dict[str, Any] = Body(...)):
    """Create a new apartment listing."""
    apartments = read_apartments()
    apt_id = str(data.get("id") or f"apt-{uuid.uuid4().hex[:6]}")
    data["id"] = apt_id
    
    # If exists, update
    for idx, item in enumerate(apartments):
        if str(item.get("id")) == apt_id:
            apartments[idx] = {**item, **data}
            write_apartments(apartments)
            return apartments[idx]

    apartments.insert(0, data)
    write_apartments(apartments)
    return data

@router.put("/{apt_id}", response_model=Dict[str, Any])
async def update_apartment(apt_id: str, data: Dict[str, Any] = Body(...)):
    """Update an existing apartment listing."""
    apartments = read_apartments()
    for idx, item in enumerate(apartments):
        if str(item.get("id")) == apt_id:
            data["id"] = apt_id
            apartments[idx] = {**item, **data}
            write_apartments(apartments)
            return apartments[idx]
    raise HTTPException(status_code=404, detail="Apartment not found")

@router.delete("/{apt_id}")
async def delete_apartment(apt_id: str):
    """Delete an apartment listing."""
    apartments = read_apartments()
    initial_len = len(apartments)
    apartments = [a for a in apartments if str(a.get("id")) != apt_id]
    if len(apartments) == initial_len:
        raise HTTPException(status_code=404, detail="Apartment not found")
    write_apartments(apartments)
    return {"ok": True, "deleted_id": apt_id}

@router.post("/bulk-save", response_model=Dict[str, Any])
async def bulk_save_apartments(items: List[Dict[str, Any]] = Body(...)):
    """Save full apartments collection."""
    write_apartments(items)
    return {"ok": True, "count": len(items)}
