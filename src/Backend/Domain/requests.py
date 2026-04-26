from pydantic import BaseModel

from src.backend.domain.models import GridQuestion, TextQuestion
from src.backend.domain.models import Question


class RegisterRequest(BaseModel):

    username:str
    password:str

class CheckKeyRequest(BaseModel):
    key:str
    formId:str

class EditFormRequest(BaseModel):

    name: str | None = None
    questions:list[GridQuestion|TextQuestion]|None = None
