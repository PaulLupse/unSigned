from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.encoders import jsonable_encoder

from jwt import InvalidTokenError, ExpiredSignatureError
from pydantic import BaseModel
from typing import Annotated
import logging, jwt, os
from datetime import timedelta

from src.backend.db.DBConnector import DBResult
from src.backend.domain.requests import RegisterRequest, EditFormRequest
from src.backend.api.Limiter import limiter
from src.backend.api.auth.KeyDistributor import distribute_keys
from src.backend.domain.auth import Key, KeyPayload, User
from src.backend.domain.models import MinimalFormInfo, NewForm, Form
from src.backend.db.DBConnector import DBConnector, get_db
from src.backend.api.auth.auth import generate_access_token, generate_key
from src.backend.api.auth.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies


logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="api/users/token")

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/users", tags=["users"])

class TokenData(BaseModel):
    username:str


async def authenticate(token : Annotated[str, Depends(oauth2_scheme)])->User:

    # eroare daca validarea da rateuri
    validation_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, key=os.getenv("SECURE_KEY"), algorithms=[os.getenv("JWT_ALG")])
        user_id = payload.get("sub")

        if user_id is None:
            raise validation_error

        db_response = db_connector.find_user(user_id = user_id)
        if db_response.status != 200: raise validation_error

        return User(id=user_id, username=payload.get("username"))

    except ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Acces token expired. Please log in again.",
                            headers={"WWW-Authenticate": "Bearer"})

    except InvalidTokenError as error:
        logger.debug(error)
        raise validation_error


EXP = 60
@router.post("/token", response_class=JSONResponse)
@limiter.limit("60/minute")
async def get_token(credentials: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request):

    logger.debug("Token called.")

    # accesam baza de date pentru a verifica validitatea credentialelor
    db_response:DBResult[str] = db_connector.validate_credentials(credentials.username, credentials.password)

    # daca credentialele nu sunt valide
    if db_response.status != 200: raise HTTPException(status_code=db_response.status, detail=db_response.message, headers={"WWW-Authenticate":"Bearer"})

    # generam un jeton de acces
    access_token:str=generate_access_token({"sub": db_response.data, "username": credentials.username}, expiration_time=timedelta(minutes=EXP))

    response : JSONResponse = JSONResponse(content={"status": "success", "loggedIn": True})

    # raspunsului ii adaugam un HTTPOnly cookie ce retine jetonul de acces. ACest Cookie e memorat in browser automat
    # si este adaugat la orice apel de API ulterior, pentru autentificare.
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True
    )

    return response


@router.post("/me", response_class=JSONResponse)
@limiter.limit("60/minute")
async def me(user:Annotated[User, Depends(authenticate)], request: Request):

    return JSONResponse(content={"username":user.username, "message":"Logged in succesfully."}, status_code=status.HTTP_200_OK)


@router.put("/register", response_class=JSONResponse)
@limiter.limit("5/minute")
async def register_user(register_request:RegisterRequest, request: Request):

    register_response:DBResult[str] = db_connector.register_user(username=register_request.username,
                                                   password=register_request.password)

    if register_response.status != 201:
        raise HTTPException(status_code=register_response.status, detail=register_response.message)

    return JSONResponse(status_code=200, content={"message":"Registered succesfully."})


@router.post("/me/logout", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def logout_user(request: Request):

    response:JSONResponse = JSONResponse(content={"message":f"Logged out succesfully."}, status_code=status.HTTP_200_OK)
    response.set_cookie(key="access_token", value="")

    return response


@router.post("/me/delete", response_class=JSONResponse)
@limiter.limit("5/minute")
async def delete_user(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult = db_connector.delete_user(user.id)

    if result.status == 200:
        return JSONResponse(content={"message":"Deleted user succesfully."}, status_code=200)
    else: return JSONResponse(content={"message":result.message}, status_code=result.status)


@router.get("/me/forms")
@limiter.limit("5/minute")
async def get_forms(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[MinimalFormInfo]] = db_connector.get_forms(user.id)
    return JSONResponse(content={"message":result.message, "forms":jsonable_encoder(result.data)}, status_code=status.HTTP_200_OK)


@router.post("/me/form/add", response_class=JSONResponse)
@limiter.limit("5/minute")
async def create_form(user:Annotated[User, Depends(authenticate)], new_form:NewForm, request: Request):

    result:DBResult[str] = db_connector.add_form(new_form, user.id)
    if result.status != 201:
        return JSONResponse(content={"message":result.message}, status_code=result.status)
    return JSONResponse(status_code=201, content={"message":"Created successfully.", "formId":result.data})


@router.post("/me/form/{form_id}/publish", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def publish_form(form_id: str, request: Request):

    result:DBResult = db_connector.publish_form(form_id)
    if result.status != 200:
        return JSONResponse(content={"message": result.message}, status_code=result.status)

    return JSONResponse(content={"message":"Form published successfully."}, status_code=200)


@router.post("/me/form/{form_id}/close", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def close_form(form_id: str, request: Request):

    result:DBResult = db_connector.close_form(form_id)

    if result.status != 200:
        return JSONResponse(content={"message": result.message}, status_code=result.status)

    return JSONResponse(content={"message": "Form closed successfully."}, status_code=200)


@router.get("/me/form/{form_id}", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def get_form_by_id(form_id:str, request: Request):

    if len(form_id)!=24:
        return JSONResponse(content={"message":"Invalid form id."},status_code=status.HTTP_404_NOT_FOUND)

    result:DBResult[Form] = db_connector.get_form(form_id)

    if result.status == 200:
        return JSONResponse(content={"message":"Queried successfully.", 'form':jsonable_encoder(result.data)}, status_code=status.HTTP_200_OK)

    return JSONResponse(content={"message": result.message}, status_code=result.status)


@router.put("/me/form/{form_id}/edit", dependencies=[Depends(authenticate)], status_code=200)
@limiter.limit("20/minute")
async def edit_form(form_id: str, edit_form_request:EditFormRequest, request:Request):

    get_form_result = db_connector.get_form(form_id)
    if get_form_result.data and get_form_result.data.datePublished is not None:
        raise HTTPException(status_code=409, detail="Published forms cannot be edited.")

    edit_form_result:DBResult = db_connector.edit_form(form_id, new_title=edit_form_request.name, new_questions=edit_form_request.questions)
    if edit_form_result.status != 200:
        raise HTTPException(status_code=edit_form_result.status, detail=edit_form_result.message)


@router.delete("/me/form/{form_id}/delete", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def delete_form(form_id:str, request: Request):

    result: DBResult = db_connector.delete_form(form_id)
    if result.status == 200:
        return JSONResponse(content={"message": "Deleted form succesfully."}, status_code=200)
    else:
        return JSONResponse(content={"message": result.message}, status_code=result.status)


class Email(BaseModel):
    email: str

class DistributeKeysRequest(BaseModel):
    emails:list[Email]


@router.post("/me/form/{form_id}/distribute_keys", response_class=JSONResponse)
@limiter.limit("5/minute")
async def dist_keys(dist_key_req:DistributeKeysRequest, user : Annotated[User, Depends(authenticate)], form_id:str, request: Request):

    if db_connector.check_form_existence(form_id):

        keys = [generate_key(data=Key(payload=KeyPayload(formId=form_id))) for _ in range(len(dist_key_req.emails))]
        await distribute_keys(keys=keys, emails=[email.email for email in dist_key_req.emails], form_owner_username=user.username)

        return JSONResponse(content={"message":"Successfully distributed keys."}, status_code=200)

    else: raise HTTPException(status_code=404, detail="Form not found.")

