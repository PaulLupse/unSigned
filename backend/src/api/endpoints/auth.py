import hashlib

from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse, Response
from fastapi.security import OAuth2PasswordRequestForm

from jwt import ExpiredSignatureError
from typing import Annotated
import logging, jwt, os
from datetime import timedelta

from src.api.auth.Authenticator import authenticate
from src.db.DBConnector import DBResult
from src.domain.requests import RegisterRequest
from src.api.Limiter import limiter
from src.domain.auth import User
from src.db.DBConnector import DBConnector, get_db
from src.api.auth.utils import generate_access_token, generate_refresh_token



router:APIRouter = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

db_connector:DBConnector = get_db()


EXP = 1


# Autentificare folosind username is parola.
# Campul "username" poate tine ori username-ul, ori email-ul utilizatorului
@router.post("/token", response_class=Response)
@limiter.limit("60/minute")
async def token(credentials: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request):

    logger.debug("Token called.")

    tk = request.cookies.get("access_token")

    if tk: # In caz ca utilizatorul este deja autentificat . . .
        try:
            jwt.decode(tk.split(' ')[1], key=os.getenv("SECURE_JWT_KEY"), algorithms=[os.getenv("JWT_ALG")])
            raise HTTPException(status_code=409, detail="Already logged in.", headers={"WWW-Authenticate":"Bearer"})
        except ExpiredSignatureError:
            ...

    # accesam baza de date pentru a verifica validitatea credentialelor
    db_response:DBResult[User] = db_connector.validate_credentials(password=credentials.password,
                                                                   identifier=credentials.username)

    # daca credentialele nu sunt valide
    if db_response.status != 200:
        raise HTTPException(status_code=db_response.status, detail=db_response.message, headers={"WWW-Authenticate":"Bearer"})

    if db_response.data is None: raise ValueError("No user data returned!")

    # generam un jeton de acces
    access_token:str=generate_access_token(
        data={
            "sub": db_response.data.id,
            "username": db_response.data.username,
            "isAdmin":db_response.data.isAdmin,
            "email": db_response.data.email,
        },
        expiration_time=timedelta(minutes=EXP))

    # stergem orice sesiune activa pe care o are utilizatorul
    db_connector.end_user_session(user_id=db_response.data.id)

    # generam un nou refresh token, care vine la pachet cu jetonul de acces
    refresh_token, hashed_refresh_token = generate_refresh_token()
    db_connector.store_refresh_token(user_id=db_response.data.id, hashed_refresh_token=hashed_refresh_token)

    response = Response()

    # raspunsului ii adaugam un HTTPOnly cookie ce retine jetonul de acces. Acest Cookie e memorat in browser automat
    # si este adaugat la orice apel de API ulterior, pentru autentificare.
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=f"{refresh_token}",
        httponly=True,
        samesite="strict",
        path="/api/auth/refresh"
    )

    return response

# Proceseaza cererea de utilizare a refresh token-ului
@router.post("/refresh", status_code=200)
async def use_refresh_token(request: Request, response: Response):

    logger.debug("Refresh token called.")

    refresh_token:str|None = request.cookies.get("refresh_token")

    if refresh_token is None:
        raise HTTPException(status_code=401, detail="Refresh token not found.")

    hashed_refresh_token:str = hashlib.sha256(refresh_token.encode()).hexdigest()

    check_response = db_connector.check_refresh_token(hashed_ref_token=hashed_refresh_token)
    user = check_response.data

    if user is not None: # Daca token-ul este valid

        # Generam un nou token de acces...
        new_access_token: str = generate_access_token(
            {"sub": user.id,
             "username": user.username,
             "isAdmin": user.isAdmin,
             "email": user.email},
            expiration_time=timedelta(minutes=EXP))

        # ...si un nou refresh token
        new_refresh_token, hashed_new_refresh_token = generate_refresh_token()

        db_connector.invalidate_refresh_token(hashed_ref_token=hashlib.sha256(refresh_token.encode()).hexdigest()) # Invalidam refresh token-ul vechi...
        db_connector.store_refresh_token(user_id=user.id, hashed_refresh_token=hashed_new_refresh_token) # ...si il stocam pe cel nou

        response.set_cookie(
            key="access_token",
            value=f"Bearer {new_access_token}",
            httponly=True,
            path="/",
        )

        response.set_cookie(
            key="refresh_token",
            value=f"{new_refresh_token}",
            httponly=True,
            samesite="strict",
            path="/api/auth/refresh"
        )

        response.status_code = 200
        return response

    logger.warning(check_response.message)
    raise HTTPException(status_code=401, detail="Refresh token invalid or not found (in db).")


# Returneaza datele utilizatorului (daca este autentificat).
@router.post("/me", response_model=User, status_code=200)
@limiter.limit("60/minute")
async def me(user:Annotated[User, Depends(authenticate)], request: Request):

    return user

# Inregistreaza un utilizator folosind email, nume de utilizator si parola
@router.put("/register", response_class=JSONResponse)
@limiter.limit("60/minute")
async def register_user(register_request:RegisterRequest, request: Request):

    register_response:DBResult[str] = (
        db_connector.register_user(
            username=register_request.username,
            password=register_request.password,
            email=register_request.email
        ))

    if register_response.status != 201:
        raise HTTPException(status_code=register_response.status, detail=register_response.message)

    return JSONResponse(status_code=200, content={"message":"Registered succesfully."})


@router.post("/me/logout", response_class=JSONResponse, dependencies=[Depends(authenticate)])
@limiter.limit("60/minute")
async def logout_user(request: Request, user:Annotated[User, Depends(authenticate)]):

    response:JSONResponse = JSONResponse(content={"message":f"Logged out succesfully."}, status_code=status.HTTP_200_OK)

    res = db_connector.end_user_session(user_id=user.id)

    if not res.ok():
        logger.warning(f"User {user.username}::{user.id} had no active refresh tokens.")

    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token", path="/api/auth/refresh")

    return response


@router.post("/me/delete", status_code=200)
@limiter.limit("60/minute")
async def delete_user(user:Annotated[User, Depends(authenticate)], request: Request, response: Response):

    db_connector.end_user_session(user_id=user.id)
    result:DBResult = db_connector.delete_user(user.id)

    if result.status == 200:

        # Important: Trebuiesc sterse cookie-urile
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        return response
    else:
        raise HTTPException(status_code=401, detail=result.message)