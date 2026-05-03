from fastapi import APIRouter, status, Request
from fastapi.encoders import jsonable_encoder
from starlette.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel

from src.backend.db.DBConnector import DBResult
from src.backend.domain.requests import CheckKeyRequest
from src.backend.api.Limiter import limiter
from src.backend.api.auth.auth import decode_key
from src.backend.domain.models import Submission, Form
from src.backend.domain.auth import Key
from src.backend.db.DBConnector import DBConnector, get_db

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/sub-users", tags=["sub-users"])


def validate_key(key:str, form_id:str)->Key|None:

    key:Key|None = decode_key(key)
    if not key:
        print("AICI 1")
        return None
    if key.payload.formId != form_id:
        print("AICI 2")
        return None
    if db_connector.check_key_usage(key):
        print("AICI 3")
        return None
    return key


@router.post("/check/{form_id}", response_class=JSONResponse)
@limiter.limit("60/minute")
async def check_form_id(form_id:str, request: Request):

    exists:bool = db_connector.check_form_existence(form_id)

    if not exists:
        return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"message":"Form not found."})
    else:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Form found."})

@router.post("/check-key", response_class=HTMLResponse)
@limiter.limit("60/minute")
async def check_key(chk_key_req: CheckKeyRequest, request: Request):

    if validate_key(chk_key_req.key, chk_key_req.formId):

        result:DBResult[Form] = db_connector.get_form(chk_key_req.formId)

        if result.status == 404:
            return JSONResponse(status_code=status.HTTP_410_GONE,
                                content={"message": "Form doesn't exist or has been deleted."})

        if result.status == 200 and result.data:

            if result.data.dateClosed is not None or result.data.datePublished is None:
                return JSONResponse(status_code=status.HTTP_423_LOCKED, content={"message": "Form unavailable."})

            return JSONResponse(status_code=status.HTTP_200_OK, content={"message":"Key verified."})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            content={"detail": "Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid Key."})

@router.post("/use-key", response_class=JSONResponse)
@limiter.limit("60/minute")
async def use_key(chk_key_req: CheckKeyRequest, request: Request):

    key:Key|None = validate_key(chk_key_req.key, chk_key_req.formId)

    if key is not None:
        result: DBResult[Form] = db_connector.get_form(chk_key_req.formId)

        if result.status == 404:
            return JSONResponse(status_code=status.HTTP_410_GONE,
                                content={"message": "Form doesn't exist or has been deleted."})

        if result.status == 200 and result.data:

            if result.data.dateClosed is not None or result.data.datePublished is None:
                return JSONResponse(status_code=status.HTTP_423_LOCKED, content={"message": "Form unavailable."})

            return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Key verified.", "form":jsonable_encoder(result.data)})

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                            content={"detail": "Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})

class SubmitFormRequest(BaseModel):
    key:str
    submission:Submission
    formId:str

@router.post("/submit-form", response_class=JSONResponse)
@limiter.limit("60/minute")
async def submit_form(submit_form_request:SubmitFormRequest, request: Request):

    validation_response: Key | None = validate_key(submit_form_request.key, submit_form_request.formId)
    print(validation_response)
    if validation_response:

        result:DBResult = db_connector.submit_form_answer(validation_response.payload.formId, submit_form_request.submission)
        use_key_result:DBResult = db_connector.use_key(validation_response)

        if result.status==use_key_result.status==200:
            return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Submitted successfully."})

        print(result.message)
        print(use_key_result.message)

        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content={"detail":"Internal Server Error."})

    return JSONResponse(status_code=status.HTTP_400_BAD_REQUEST, content={"message":"Invalid key."})



