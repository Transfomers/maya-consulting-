from pydantic import BaseModel
from typing import Dict, Any

class SubmissionInput(BaseModel):
    type: str
    payload: Dict[str, Any]
