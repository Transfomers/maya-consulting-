import os
import json
import logging
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body, UploadFile, File

router = APIRouter()
logger = logging.getLogger(__name__)

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "vehicles.json")
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"}

def read_vehicles() -> List[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error reading {DATA_FILE}: {e}")
        return []

def write_vehicles(vehicles: List[Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(vehicles, f, indent=2, ensure_ascii=False)

@router.post("/upload-photo")
async def upload_vehicle_photo(file: UploadFile = File(...)):
    """Upload photo directly from local machine to server uploads folder."""
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"
    unique_name = f"car_{uuid.uuid4().hex[:12]}{ext}"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        return {"url": f"/uploads/{unique_name}", "filename": unique_name}
    except Exception as e:
        logger.error(f"Upload vehicle photo error: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement de l'image.")

@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_vehicles():
    """Retrieve all vehicles currently stored in the catalogue."""
    return read_vehicles()

@router.get("/{vehicle_id}", response_model=Dict[str, Any])
async def get_vehicle_by_id(vehicle_id: str):
    """Retrieve a single vehicle by id or slug."""
    vehicles = read_vehicles()
    for v in vehicles:
        if str(v.get("id")) == vehicle_id or v.get("slug") == vehicle_id:
            return v
    raise HTTPException(status_code=404, detail="Vehicle not found")

@router.post("", response_model=Dict[str, Any])
@router.post("/", response_model=Dict[str, Any])
async def create_vehicle(car: Dict[str, Any] = Body(...)):
    """Create a new vehicle listing and persist to disk/database."""
    vehicles = read_vehicles()
    # Check if id already exists
    car_id = str(car.get("id", ""))
    if car_id and any(str(v.get("id")) == car_id for v in vehicles):
        # Update existing
        for idx, v in enumerate(vehicles):
            if str(v.get("id")) == car_id:
                vehicles[idx] = {**v, **car}
                write_vehicles(vehicles)
                return vehicles[idx]

    vehicles.insert(0, car)
    write_vehicles(vehicles)
    return car

@router.put("/{vehicle_id}", response_model=Dict[str, Any])
async def update_vehicle(vehicle_id: str, updated_fields: Dict[str, Any] = Body(...)):
    """Update characteristics of an existing vehicle listing."""
    vehicles = read_vehicles()
    found_idx = None
    for idx, v in enumerate(vehicles):
        if str(v.get("id")) == vehicle_id or v.get("slug") == vehicle_id:
            found_idx = idx
            break

    if found_idx is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    updated = {**vehicles[found_idx], **updated_fields}
    vehicles[found_idx] = updated
    write_vehicles(vehicles)
    return updated

@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str):
    """Delete a vehicle from the catalogue."""
    vehicles = read_vehicles()
    filtered = [v for v in vehicles if str(v.get("id")) != vehicle_id and v.get("slug") != vehicle_id]
    if len(filtered) == len(vehicles):
        raise HTTPException(status_code=404, detail="Vehicle not found")
    write_vehicles(filtered)
    return {"success": True, "message": f"Vehicle {vehicle_id} deleted"}

@router.post("/bulk-save")
async def bulk_save_vehicles(all_vehicles: List[Dict[str, Any]] = Body(...)):
    """Save the full list of vehicles in bulk."""
    write_vehicles(all_vehicles)
    return {"success": True, "count": len(all_vehicles)}
