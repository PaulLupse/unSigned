from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from typing import Annotated
import logging

from starlette.responses import Response

from src.api.auth.Authenticator import authenticate
from src.domain.models import MinimalTemplateInfo
from src.db.DBConnector import DBResult
from src.common import limiter
from src.domain.auth import User, UserStats, UserProfileWithStats
from src.domain.models import MinimalFormInfo
from src.db.DBConnector import DBConnector, get_db

from src.common import logger
from src.domain.requests import ChangeUsernameRequest

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/user", tags=["users"])

# Returneaza datele utilizatorului curent (daca este autentificat)
@router.get("/me", response_model=User, status_code=200)
@limiter.limit("60/minute")
async def me(user:Annotated[User, Depends(authenticate)], request: Request):

    return user


def get_user_by_identifier(identifier:str)->User:

    if identifier[0] == '@':
        result:DBResult[User | None] = db_connector.find_user(username=identifier[1::])
    else:
        result: DBResult[User | None] = db_connector.find_user(user_id=identifier)

    if not result.ok() or not result.data :
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


# Returneaza datele despre un anumit utilizator
# TODO: implementeaza profiluri de utilizator private
@router.get("/{identifier}", response_model=User, status_code=200)
@limiter.limit("60/minute")
async def get_user_data(identifier:str,
                        request: Request):

    user = get_user_by_identifier(identifier)

    return user

@router.get("/{identifier}/stats", response_model=UserProfileWithStats, status_code=200)
@limiter.limit("60/minute")
async def get_user_stats(identifier:str,
                         request: Request):

    user = get_user_by_identifier(identifier)
    get_stats_result = db_connector.get_user_stats(user_id=user.id)

    if not get_stats_result.ok() or not get_stats_result.data:
        raise HTTPException(status_code=get_stats_result.status,
                            detail=get_stats_result.message)

    return UserProfileWithStats(user=user, stats=get_stats_result.data)

@router.get("/{user_id}/forms", response_model=list[MinimalFormInfo], status_code=200)
@limiter.limit("60/minute")
async def get_user_forms(user:Annotated[User, Depends(authenticate)],
                         user_id:
                         str, request: Request):

    if user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    result:DBResult[list[MinimalFormInfo]] = db_connector.get_forms(user_id)
    return result.data

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

# Modifica username-ul unui utilizator
# @router.put("/{user_id}/change/username", status_code=200)
async def change_username(user:Annotated[User, Depends(authenticate)],
                          req:ChangeUsernameRequest,
                          user_id,
                          request: Request):

    if user_id != user.id and not user.isAdmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    result = db_connector.change_username(user_id, new_username=req.newUsername)

    if not result.ok(): raise HTTPException(result.status, result.message)
    

@router.delete("/{user_id}/delete", status_code=200)
@limiter.limit("60/minute")
async def delete_user(user: Annotated[User, Depends(authenticate)],
                      user_id: str,
                      request: Request,
                      response: Response):

    if not user_id == user.id and not user.isAdmin:
        raise HTTPException(status_code=403, detail="You are unauthorized to perform this action.")

    db_connector.end_user_session(user_id=user.id)
    result: DBResult = db_connector.delete_user(user.id)

    if result.status == 200:

        if user_id == user.id:
            # Important: Trebuiesc sterse cookie-urile
            response.delete_cookie(key="access_token")
            response.delete_cookie(key="refresh_token")

        response.status_code = 200
        return response
    else:
        raise HTTPException(status_code=401, detail=result.message)