from fastapi import APIRouter, status, HTTPException
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm

from starlette.status import HTTP_200_OK

from jwt import InvalidTokenError, ExpiredSignatureError
from pydantic import BaseModel
from typing import Annotated
import logging
import jwt
from datetime import timedelta

from src.Backend.DB.DBConnector import Database
from src.Backend.Utilities import generate_access_token
from src.Backend.API.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies

from src.Backend.Domain.Models import Item

MDB_URL = "mongodb://localhost:27017/"
SK = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALG = "HS256"

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="users/token")

def get_db(url:str)->Database:
    try:
        return Database(url)
    except:
        raise HTTPException(status_code=500, detail="Internal Server Error")

db_connector:Database = get_db(MDB_URL)

router:APIRouter = APIRouter(prefix="/users")

class TokenData(BaseModel):
    username:str

class RegisterData(BaseModel):
    username:str
    password:str


async def authenticate(token : Annotated[str, Depends(oauth2_scheme)]):

    # eroare daca validarea da rateuri
    validation_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, key=SK, algorithms=[ALG])
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
async def get_token(credentials: Annotated[OAuth2PasswordRequestForm, Depends()]):

    logger.debug("Token called.")

    # accesam baza de date pentru a verifica validitatea credentialelor
    db_response = db_connector.validate_credentials(credentials.username, credentials.password)

    # daca nu a fost gasit un utilizator cu username-ul specificat
    if db_response == 404:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.", headers={"WWW-Authenticate": "Bearer"})

    # daca a fost gasit, dar parola nu corespunde
    if db_response == 400:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid password.", headers={"WWW-Authenticate": "Bearer"})

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
async def me(login_response:Annotated[str, Depends(authenticate)]):

    return JSONResponse(content={"username":login_response, "message":"Logged in succesfully."}, status_code=HTTP_200_OK)

@router.put("/register", response_class=JSONResponse)
async def register_user(register_data:RegisterData):

    register_response = db_connector.register_user(username=register_data.username,
                                                   password=register_data.password)

    if register_response == 409:
        return JSONResponse(content={"message":"User already exists."},
                            status_code=status.HTTP_409_CONFLICT)

    elif register_response == 201:
        return JSONResponse(content={"message":"Registered succesfuly."},
                            status_code=status.HTTP_201_CREATED)

@router.post("/me/logout", response_class=JSONResponse, dependencies=[Depends(authenticate)])
async def logout_user():

    response:JSONResponse = JSONResponse(content={"message":f"Logged out succesfully."}, status_code=status.HTTP_200_OK)
    response.set_cookie(key="access_token", value="")

    return response

@router.post("/me/delete", response_class=JSONResponse)
async def delete_user(login_response:Annotated[str, Depends(authenticate)]):

    delete_response:int = db_connector.delete_user(login_response)

    if delete_response == 200:
        return JSONResponse(content={"message":"Deleted user succesfully."}, status_code=200)
    else: return JSONResponse(content={"message":"Could not delete user."}, status_code=400)

@router.post("/me/items", response_class=JSONResponse, dependencies=[Depends(authenticate)])
async def add_item(item:Item):

    add_response = db_connector.add_item(item)
    if add_response == 409:
        return JSONResponse(content={"message":"Item with this name already exists."},
                            status_code=status.HTTP_409_CONFLICT)

    if add_response == 400:
        return JSONResponse(content={"message":"Invalid item fields."},
                            status_code=status.HTTP_400_BAD_REQUEST)


    else: return JSONResponse(content={"message":"Item added successfully."},
                              status_code=status.HTTP_201_CREATED)
@router.get("/me/items")
async def get_items(login_response:Annotated[str, Depends(authenticate)]):

    item_list:list[Item] = db_connector.get_items(login_response)

    return JSONResponse(content={"message":"Returned successfully.", "items":item_list}, status_code=status.HTTP_200_OK)
