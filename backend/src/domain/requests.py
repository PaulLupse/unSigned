from pydantic import BaseModel

from src.domain.models import GridQuestion, TextQuestion


class RegisterRequest(BaseModel):

    username:str
    password:str
    email:str

class HandleGoogleUserRequest(BaseModel):
    googleCode:str

class CheckKeyRequest(BaseModel):
    key:str
    formId:str

class EditFormRequest(BaseModel):

    name: str | None = None
    questions:list[GridQuestion|TextQuestion]|None = None

class VerificationCodeRequest(BaseModel):

    email:str

class VerifyEmailRequest(BaseModel):

    email:str
    code:str

class ChangeUsernameRequest(BaseModel):

    newUsername:str