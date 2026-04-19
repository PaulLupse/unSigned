from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.encoders import jsonable_encoder

from jwt import InvalidTokenError, ExpiredSignatureError
from pydantic import BaseModel
from typing import Annotated, Tuple
import logging, jwt, os, dotenv
from datetime import timedelta

from src.Backend.API.Limiter import limiter
from src.Backend.API.KeyDistributor import distribute_keys
from src.Backend.Domain.Credentials import Key, KeyFooter, KeyPayload
from src.Backend.Domain.General import MinimalFormInfo, NewForm
from src.Backend.DB.DBConnector import DBConnector, get_db
from src.Backend.API.Auth import generate_access_token, generate_key, decode_key
from src.Backend.API.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies

from src.Backend.Domain.General import Form

dotenv.load_dotenv()

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="users/token")

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/users", tags=["users"])

class TokenData(BaseModel):
    username:str

class RegisterData(BaseModel):
    username:str
    password:str


async def authenticate(token : Annotated[str, Depends(oauth2_scheme)])->str:

    # eroare daca validarea da rateuri
    validation_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, key=os.getenv("SECURE_KEY"), algorithms=[os.getenv("JWT_ALG")])
        username = payload.get("sub")

        if username is None:
            raise validation_error

        token_data = TokenData(username=username)

        db_response = db_connector.find_user(username=token_data.username)
        if db_response == 404:
            raise validation_error

        return token_data.username

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
    db_response = db_connector.validate_credentials(credentials.username, credentials.password)

    # daca nu a fost gasit un utilizator cu username-ul specificat
    if db_response == 404:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.", headers={"WWW-Authenticate": "Bearer"})

    # daca a fost gasit, dar parola nu corespunde
    if db_response == 400:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid password.", headers={"WWW-Authenticate": "Bearer"})

    # generam un jeton de acces
    access_token:str=generate_access_token({"sub": credentials.username}, expiration_time=timedelta(minutes=EXP))

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
async def me(login_response:Annotated[str, Depends(authenticate)], request: Request):

    return JSONResponse(content={"username":login_response, "message":"Logged in succesfully."}, status_code=status.HTTP_200_OK)

@router.put("/register", response_class=JSONResponse)
@limiter.limit("5/minute")
async def register_user(register_data:RegisterData, request: Request):

    register_response = db_connector.register_user(username=register_data.username,
                                                   password=register_data.password)

    if register_response == 409:
        return JSONResponse(content={"message":"User already exists."},
                            status_code=status.HTTP_409_CONFLICT)

    else:
        return JSONResponse(content={"message":"Registered succesfuly."},
                            status_code=status.HTTP_201_CREATED)

@router.post("/me/logout", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def logout_user(request: Request):

    response:JSONResponse = JSONResponse(content={"message":f"Logged out succesfully."}, status_code=status.HTTP_200_OK)
    response.set_cookie(key="access_token", value="")

    return response

@router.post("/me/delete", response_class=JSONResponse)
@limiter.limit("5/minute")
async def delete_user(login_response:Annotated[str, Depends(authenticate)], request: Request):

    delete_response:int = db_connector.delete_user(login_response)

    if delete_response == 200:
        return JSONResponse(content={"message":"Deleted user succesfully."}, status_code=200)
    else: return JSONResponse(content={"message":"Could not delete user."}, status_code=400)

@router.get("/me/forms")
@limiter.limit("5/minute")
async def get_forms(login_response:Annotated[str, Depends(authenticate)], request: Request):

    form_list:list[MinimalFormInfo] = db_connector.get_forms(login_response)
    return JSONResponse(content={"message":"Returned successfully.", "forms":jsonable_encoder(form_list)}, status_code=status.HTTP_200_OK)

@router.post("/me/form/add", response_class=JSONResponse)
@limiter.limit("5/minute")
async def create_form(login_response:Annotated[str, Depends(authenticate)], new_form:NewForm, request: Request):

    add_response, form_id = db_connector.add_form(new_form, login_response)
    if add_response == 409:
        return JSONResponse(content={"message":"Form with this name already exists."},
                            status_code=status.HTTP_409_CONFLICT)

    if add_response == 400:
        return JSONResponse(content={"message":"Invalid form fields."},
                            status_code=status.HTTP_400_BAD_REQUEST)

    else:
        print(add_response)
        return JSONResponse(content={"message":"Form added successfully.", "formId":str(form_id)},
                              status_code=status.HTTP_201_CREATED)

@router.post("/me/form/{form_id}/publish", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def publish_form(form_id: str, request: Request):

    publish_form_response = db_connector.publish_form(form_id)
    if publish_form_response == 404:
        return JSONResponse(content={"message":"Form not found."})

    if publish_form_response == 409:
        return JSONResponse(content={"message": "Form already closed."})

    return JSONResponse(content={"message":"Form published successfully."})

@router.post("/me/form/{form_id}/close", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def close_form(form_id: str, request: Request):
    publish_form_response = db_connector.close_form(form_id)
    if publish_form_response == 404:
        return JSONResponse(content={"message": "Form not found."})

    if publish_form_response == 409:
        return JSONResponse(content={"message": "Form was not yet published."})

    return JSONResponse(content={"message": "Form closed successfully."})

@router.get("/me/form/{form_id}", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def get_form_by_id(form_id:str, request: Request):

    if len(form_id)!=24:
        return JSONResponse(content={"message":"Invalid form id."},status_code=status.HTTP_404_NOT_FOUND)

    form_status, form = db_connector.get_form(form_id)

    if form_status == 200 or form_status == 423:
        return JSONResponse(content={"message":"Queried successfully.", 'form':jsonable_encoder(form)}, status_code=status.HTTP_200_OK)

    return JSONResponse(content={"message":"Form not found."}, status_code=404)

@router.delete("/me/form/{form_id}/delete", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("5/minute")
async def delete_form(form_id:str, request: Request):

    delete_form_response: int = db_connector.delete_form(form_id)
    if delete_form_response == 200:
        return JSONResponse(content={"message": "Deleted form succesfully."}, status_code=200)

    else:
        return JSONResponse(content={"message": "Form not found."}, status_code=404)

class Email(BaseModel):
    email: str

class DistributeKeysRequest(BaseModel):
    emails:list[Email]

@router.post("/me/form/{form_id}/distribute_keys", response_class=JSONResponse)
@limiter.limit("5/minute")
async def dist_keys(dist_key_req:DistributeKeysRequest, username : Annotated[str, Depends(authenticate)], form_id:str, request: Request):

    keys = [generate_key(data=Key(payload=KeyPayload(formId=form_id))) for _ in range(len(dist_key_req.emails))]
    await distribute_keys(keys=keys, emails=[email.email for email in dist_key_req.emails], form_owner_username=username)

    return JSONResponse(content={"message":"Successfully distributed keys."}, status_code=200)

