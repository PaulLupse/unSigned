from bson import ObjectId
from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.encoders import jsonable_encoder

from jwt import ExpiredSignatureError
from pydantic import BaseModel
from typing import Annotated
import logging, jwt, os
from datetime import timedelta

from src.api.auth.Authenticator import authenticate
from src.domain.models import TextQuestionAnswerStatistic, GridQuestionAnswerStatistic
from src.db.DBConnector import DBResult
from src.domain.requests import RegisterRequest, EditFormRequest
from src.api.Limiter import limiter
from src.api.KeyDistributor import distribute_keys
from src.domain.auth import Key, KeyPayload, User
from src.domain.models import MinimalFormInfo, NewForm, Form
from src.db.DBConnector import DBConnector, get_db
from src.api.auth.utils import generate_access_token, generate_key

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)


db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/users", tags=["users"])

class TokenData(BaseModel):
    username:str


@router.get("/me/forms")
@limiter.limit("60/minute")
async def get_forms(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[MinimalFormInfo]] = db_connector.get_forms(user.id)
    return JSONResponse(content={"message":result.message, "forms":jsonable_encoder(result.data)}, status_code=status.HTTP_200_OK)


@router.post("/me/form/add", response_class=JSONResponse)
@limiter.limit("60/minute")
async def create_form(user:Annotated[User, Depends(authenticate)], new_form:NewForm, request: Request):

    result:DBResult[str] = db_connector.add_form(new_form, user.id)
    if result.status != 201:
        return JSONResponse(content={"message":result.message}, status_code=result.status)
    return JSONResponse(status_code=201, content={"message":"Created successfully.", "formId":result.data})


@router.post("/me/form/{form_id}/publish", response_class=JSONResponse)
@limiter.limit("60/minute")
async def publish_form(form_id: str, user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult = db_connector.publish_form(form_id, owner_id=user.id)
    if result.status != 200:
        return JSONResponse(content={"message": result.message}, status_code=result.status)

    return JSONResponse(content={"message":"Form published successfully."}, status_code=200)


@router.post("/me/form/{form_id}/close", response_class=JSONResponse)
@limiter.limit("60/minute")
async def close_form(form_id: str, request: Request, user:Annotated[User, Depends(authenticate)]):

    result:DBResult = db_connector.close_form(form_id, user.id)

    if result.status != 200:
        return JSONResponse(content={"message": result.message}, status_code=result.status)

    return JSONResponse(content={"message": "Form closed successfully."}, status_code=200)


@router.get("/me/form/{form_id}", response_class=JSONResponse)
@limiter.limit("60/minute")
async def get_form_by_id(form_id:str, request: Request, user:Annotated[User, Depends(authenticate)]):

    if not ObjectId.is_valid(form_id):
        return JSONResponse(content={"message":"Invalid form id."},status_code=status.HTTP_404_NOT_FOUND)

    result:DBResult[Form] = db_connector.get_form(form_id, user.id)

    if result.status == 200:
        return JSONResponse(content={"message":"Queried successfully.", 'form':jsonable_encoder(result.data)}, status_code=status.HTTP_200_OK)

    return JSONResponse(content={"message": result.message}, status_code=result.status)


@router.put("/me/form/{form_id}/edit", dependencies=[Depends(authenticate)], status_code=200)
@limiter.limit("60/minute")
async def edit_form(form_id: str, edit_form_request:EditFormRequest, request:Request, user:Annotated[User, Depends(authenticate)]):

    print(edit_form_request)

    get_form_result = db_connector.get_form(form_id, user.id)
    if get_form_result.data and get_form_result.data.datePublished is not None:
        raise HTTPException(status_code=409, detail="Published forms cannot be edited.")

    edit_form_result:DBResult = db_connector.edit_form(form_id, new_title=edit_form_request.name, new_questions=edit_form_request.questions, owner_id=user.id)
    if edit_form_result.status != 200:
        raise HTTPException(status_code=edit_form_result.status, detail=edit_form_result.message)


@router.delete("/me/form/{form_id}/delete", response_class=JSONResponse)
@limiter.limit("60/minute")
async def delete_form(form_id:str, request: Request, user:Annotated[User, Depends(authenticate)]):

    result: DBResult = db_connector.delete_form(form_id, user.id)
    if result.status == 200:
        return JSONResponse(content={"message": "Deleted form succesfully."}, status_code=200)
    else:
        return JSONResponse(content={"message": result.message}, status_code=result.status)


@router.get("/me/form/{form_id}/submission-data", response_model=list[TextQuestionAnswerStatistic|GridQuestionAnswerStatistic])
async def submission_data(form_id:str, request: Request, user:Annotated[User, Depends(authenticate)]):

    sub_data_res:DBResult[list[TextQuestionAnswerStatistic|GridQuestionAnswerStatistic]] = db_connector.get_submission_data(form_id=form_id, owner_id=user.id)

    if sub_data_res.status != 200: raise HTTPException(status_code=sub_data_res.status, detail=sub_data_res.message)

    return sub_data_res.data


class Email(BaseModel):
    email: str

class DistributeKeysRequest(BaseModel):
    emails:list[Email]

# Trimite chei de access la formularul cu id-ul specificat, email-urilor specificate.
@router.post("/me/form/{form_id}/distribute_keys", response_class=JSONResponse)
@limiter.limit("60/minute")
async def dist_keys(dist_key_req:DistributeKeysRequest, user : Annotated[User, Depends(authenticate)], form_id:str, request: Request):

    if db_connector.check_form_existence(form_id, user.id):

        keys = [generate_key(data=Key(payload=KeyPayload(formId=form_id))) for _ in range(len(dist_key_req.emails))]
        await distribute_keys(keys=keys, emails=[email.email for email in dist_key_req.emails], form_owner_username=user.username, form_id = form_id)

        return JSONResponse(content={"message":"Successfully distributed keys."}, status_code=200)

    else: raise HTTPException(status_code=404, detail="Form not found.")


