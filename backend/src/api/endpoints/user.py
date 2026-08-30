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
from src.domain.models import TextQuestionAnswerStatistic, GridQuestionAnswerStatistic, MinimalTemplateInfo
from src.db.DBConnector import DBResult
from src.domain.requests import RegisterRequest, EditFormRequest
from src.api.Limiter import limiter
from src.api.KeyDistributor import distribute_keys
from src.domain.auth import Key, KeyPayload, User
from src.domain.models import MinimalFormInfo, NewForm, Form
from src.db.DBConnector import DBConnector, get_db
from src.api.auth.utils import generate_access_token, generate_key
from src.utilities import Action

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)


db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/user", tags=["users"])

@router.get("/{user_id}/forms")
@limiter.limit("60/minute")
async def get_user_forms(user:Annotated[User, Depends(authenticate)],
                         user_id:
                         str, request: Request):

    if user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    result:DBResult[list[MinimalFormInfo]] = db_connector.get_forms(user_id)
    return JSONResponse(content={"message":result.message, "forms":jsonable_encoder(result.data)}, status_code=status.HTTP_200_OK)

@router.get("/{user_id}/templates", status_code=200, response_model=list[MinimalTemplateInfo])
@limiter.limit("60/minute")
async def get_user_templates(user:Annotated[User, Depends(authenticate)],
                             user_id,
                             request: Request):

    if user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    get_templates_response:DBResult[list[MinimalTemplateInfo]] = db_connector.get_templates(user_id, status = 'private')

    if get_templates_response.status != 200:
        raise HTTPException(status_code= get_templates_response.status, detail = get_templates_response.message)

    return get_templates_response.data