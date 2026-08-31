from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from typing import Annotated
import logging

from src.api.auth.Authenticator import authenticate
from src.domain.models import MinimalTemplateInfo
from src.db.DBConnector import DBResult
from src.api.Limiter import limiter
from src.domain.auth import User, UserStats
from src.domain.models import MinimalFormInfo
from src.db.DBConnector import DBConnector, get_db

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)


db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/user", tags=["users"])

# Returneaza datele utilizatorului curent (daca este autentificat)
@router.get("/me", response_model=User, status_code=200)
@limiter.limit("60/minute")
async def me(user:Annotated[User, Depends(authenticate)], request: Request):

    return user

# Returneaza datele despre un anumit utilizator
@router.get("/{user_id}", response_model=User, status_code=200)
@limiter.limit("60/minute")
async def get_user_data(user_id:str,
                        request: Request):

    result:DBResult[User|None] = db_connector.find_user(user_id=user_id)

    if not result.ok():
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data

@router.get("/{user_id}/stats", response_model=UserStats, status_code=200)
@limiter.limit("60/minute")
async def get_user_stats(user_id:str,
                         request: Request):

    result:DBResult[UserStats] = db_connector.get_user_stats(user_id=user_id)

    return result.data

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