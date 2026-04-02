from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class Key(BaseModel):
    keyId: str
    formId: str
    expires: datetime|None