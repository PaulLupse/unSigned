from fastapi import APIRouter, status, Request
from fastapi.encoders import jsonable_encoder
from starlette.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel

from src.Backend.API.Limiter import limiter
from src.Backend.API.Auth import decode_key
from src.Backend.Domain.General import Submission, Form
from src.Backend.Domain.Credentials import Key
from src.Backend.DB.DBConnector import DBConnector, get_db

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/sub-users", tags=["sub-users"])


def validate_key(key:str, form_id:str)->Key|None:
    key:Key|None = decode_key(key)
    if not key:
        return None
    if key.payload.formId != form_id:
        return None
    if db_connector.check_key_usage(key):
        return None
    return key

class CheckKeyRequest(BaseModel):
    key:str
    formId:str

@router.post("/check/{form_id}", response_class=JSONResponse)
@limiter.limit("5/minute")
async def check_form_id(form_id:str, request: Request):

    status_code:int = db_connector.check_form_existence(form_id)

    if status_code == 404:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message":"Form not found."})
    else:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Form found."})

@router.post("/check-key", response_class=HTMLResponse)
@limiter.limit("5/minute")
async def check_key(chk_key_req:CheckKeyRequest, request: Request):

    if validate_key(chk_key_req.key, chk_key_req.formId):

        status_code, associated_form = db_connector.get_form(chk_key_req.formId)

        if status_code == 404:
            return JSONResponse(status_code=status.HTTP_410_GONE,
                                content={"message": "Form doesn't exist or has been deleted."})

        if status_code == 423:
            return JSONResponse(status_code=status.HTTP_423_LOCKED, content={"message": "Form unavailable."})

        if status_code == 200:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Key verified."})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            content={"detail": "Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid Key."})

@router.post("/use-key", response_class=JSONResponse)
@limiter.limit("5/minute")
async def use_key(chk_key_req:CheckKeyRequest, request: Request):

    key:Key|None = validate_key(chk_key_req.key, chk_key_req.formId)

    if key is not None:
        status_code, associated_form  = db_connector.get_form(key.payload.formId)

        if status_code == 404:
            return JSONResponse(status_code=status.HTTP_410_GONE, content={"message": "Form doesn't exist or has been deleted."})

        if status_code == 423:
            return JSONResponse(status_code=status.HTTP_423_LOCKED, content={"message": "Form closed."})

        if status_code == 200:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Key verified.", "form":jsonable_encoder(associated_form)})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            content={"detail": "Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})

class SubmitFormRequest(BaseModel):
    key:str
    submission:Submission
    formId:str

@router.post("/submit-form", response_class=JSONResponse)
@limiter.limit("5/minute")
async def submit_form(submit_form_request:SubmitFormRequest, request: Request):

    validation_response: Key | None = validate_key(submit_form_request.key, submit_form_request.formId)
    if validation_response:

        submit_form_response = db_connector.submit_form_answer(validation_response, submit_form_request.submission)

        if submit_form_response==200:
            return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Submitted successfully."})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail":"Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})



