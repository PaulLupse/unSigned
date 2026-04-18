from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class KeyPayload(BaseModel):
    formId: str

class KeyFooter(BaseModel):
    keyId: Optional[str] = None

class Key(BaseModel):
    payload: KeyPayload
    footer: Optional[KeyFooter] = KeyFooter()

