from pydantic import BaseModel
from typing import Dict, Any, Optional

class SubmissionInput(BaseModel):
    type: Optional[str] = None
    form_type: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None
    data: Optional[Dict[str, Any]] = None
