from datetime import datetime

from fastapi import APIRouter, status, HTTPException
from fastapi.encoders import jsonable_encoder
from starlette.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel

from src.Backend.Domain.General import Submission, Form
from src.Backend.Domain.Credentials import Key
from src.Backend.DB.DBConnector import Database
from src.Backend.API.key_validator import decode_key

def get_db(url:str)->Database:
    try:
        return Database(url)
    except:
        raise HTTPException(status_code=500, detail="Internal Server Error")

MDB_URL = "mongodb://localhost:27017/"

db_connector:Database = get_db(MDB_URL)

router:APIRouter = APIRouter(prefix="/sub-users", tags=["sub-users"])

class CheckKeyRequest(BaseModel):
    key:str
    formId:str

def validate_key(key:str, form_id:str)->Key|None:

    decoded_key:Key = decode_key(key)
    if not decoded_key:
        return None
    if decoded_key.formId != form_id:
        return None
    if (decoded_key.expires is not None) and (decoded_key.expires < datetime.now()):
        return None
    if db_connector.check_key_usage(decoded_key):
        return None

    return decoded_key

@router.post("/check/{form_id}", response_class=JSONResponse)
async def check_form_id(form_id:str):

    status_code:int = db_connector.check_form_existence(form_id)

    if status_code == 404:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message":"Form not found."})
    else:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Form found."})

@router.post("/check-key", response_class=HTMLResponse)
async def check_key(request:CheckKeyRequest):

    if validate_key(request.key, request.formId):
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Key verified."})
    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid Key."})

@router.post("/use-key", response_class=JSONResponse)
async def use_key(request:CheckKeyRequest):

    validation_response:Key|None = validate_key(request.key, request.formId)

    if validation_response:
        associated_form, status_code  = db_connector.get_form(validation_response.formId)

        print(associated_form)

        if status_code == 404:
            return JSONResponse(status_code=status.HTTP_410_GONE, content={"message": "Form doesn't exist or has been deleted."})

        if status_code == 423:
            return JSONResponse(status_code=status.HTTP_423_LOCKED, content={"message": "Form closed."})

        if status_code == 200:
            return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Key verified.", "form":jsonable_encoder(associated_form)})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})

class SubmitFormRequest(BaseModel):
    key:str
    submission:Submission
    formId:str

@router.post("/submit-form", response_class=JSONResponse)
async def submit_form(submit_form_request:SubmitFormRequest):

    validation_response: Key | None = validate_key(submit_form_request.key, submit_form_request.formId)
    if validation_response:

        submit_form_response = db_connector.submit_form_answer(validation_response, submit_form_request.submission)

        if submit_form_response==200:
            return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Submitted successfully."})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail":"Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})


