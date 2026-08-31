from datetime import datetime

from pydantic import BaseModel
from typing import Optional


class User(BaseModel):
    id:str
    username:str
    isAdmin:bool
    email:str

class KeyPayload(BaseModel):
    formId: str

class KeyFooter(BaseModel):
    keyId: Optional[str] = None

class Key(BaseModel):
    payload: KeyPayload
    footer: Optional[KeyFooter] = KeyFooter()

class VerificationCode(BaseModel):

    id:str
    code:str
    expiresAt:datetime

class UserStats(BaseModel):
    formCount: int
    templateCount: int


