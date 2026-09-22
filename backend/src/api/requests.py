from src.api.BaseModel import BaseModel
from src.domain.models import Question


class RegisterRequest(BaseModel):
    username:str
    password:str
    email:str


class HandleGoogleUserRequest(BaseModel):
    google_code:str


class CheckKeyRequest(BaseModel):
    key:str
    form_id:str


class EditFormRequest(BaseModel):
    name: str | None = None
    questions:list[Question]|None = None


class VerificationCodeRequest(BaseModel):
    email:str


class VerifyEmailRequest(BaseModel):
    email:str
    code:str


class ChangeUsernameRequest(BaseModel):
    new_username:str