from src.api.BaseModel import BaseModel
from src.domain.models import Question, NewForm, NewTemplate, Submission


class RegisterRequest(BaseModel):
    username:str
    password:str
    email:str


class HandleGoogleUserRequest(BaseModel):
    google_code:str


class CheckKeyRequest(BaseModel):
    key:str
    form_id:str


class VerificationCodeRequest(BaseModel):
    email:str


class VerifyEmailRequest(BaseModel):
    email:str
    code:str


class ChangeUsernameRequest(BaseModel):
    new_username:str


class SubmitFormRequest(BaseModel):
    key:str
    submission:Submission
    form_id:str