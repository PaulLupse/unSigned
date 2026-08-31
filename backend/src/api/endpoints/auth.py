from annotated_doc import Doc
from fastapi import APIRouter, status, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse, Response
from fastapi.security import OAuth2PasswordRequestForm

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from jwt import ExpiredSignatureError
from typing import Annotated, Tuple
import logging, jwt, os, hashlib, random, requests
from datetime import timedelta

from pydantic import BaseModel

from src.api.EmailSender import send_verification_email
from src.api.auth.Authenticator import authenticate
from src.db.DBConnector import DBResult
from src.domain.requests import RegisterRequest, VerificationCodeRequest, VerifyEmailRequest, HandleGoogleUserRequest
from src.api.Limiter import limiter
from src.domain.auth import User
from src.db.DBConnector import DBConnector, get_db
from src.api.auth.utils import generate_access_token, generate_refresh_token
from src.utilities import validate_email

router:APIRouter = APIRouter(prefix="/auth", tags=["auth"])

logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

db_connector:DBConnector = get_db()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")

if GOOGLE_CLIENT_ID is None:  raise ValueError("GOOGLE_CLIENT_ID not set.")
if GOOGLE_CLIENT_SECRET is None:  raise ValueError("GOOGLE_CLIENT_SECRET not set.")


# Verifica starea de autentificare a utilizatorului.
def check_login_state(request: Request)->bool:

    tk = request.cookies.get("access_token")
    if tk:
        try:
            jwt.decode(tk.split(' ')[1], key=os.getenv("SECURE_JWT_KEY"), algorithms=[os.getenv("JWT_ALG")])
            return True
        except ExpiredSignatureError:
            ...

    return False

# Creeaza si returneaza:
# - un access token
# - un refresh token
# - hash-ul refresh token-ului (pentru a fii stocat in db)
def generate_tokens(user:User):

    access_token: str = generate_access_token(
        data={
            "sub": user.id,
            "username": user.username,
            "isAdmin": user.isAdmin,
            "email": user.email,
        },
        expiration_time=timedelta(minutes=EXP))

    # generam un nou refresh token, care vine la pachet cu jetonul de acces
    refresh_token, hashed_refresh_token = generate_refresh_token()
    return access_token, refresh_token, hashed_refresh_token

# Verifica detaliile de autentificare ale unui utilizator. Daca sunt valide, returneaza un token de acces si un token de
# reimprospatare (in acea ordine), care trebuiesc setate manual in api response.
def create_session(identifier:Annotated[str, Doc("Username or email")], password:str) -> Tuple[str, str]:


    # accesam baza de date pentru a verifica validitatea credentialelor
    db_response: DBResult[User] = db_connector.validate_credentials(password=password,
                                                                    identifier=identifier)

    # daca credentialele nu sunt valide
    if db_response.status != 200:
        raise HTTPException(status_code=db_response.status, detail=db_response.message,
                            headers={"WWW-Authenticate": "Bearer"})

    # in caz ca nu au fost returnate date despre utilizator
    if db_response.data is None: raise ValueError("No user data returned!")

    access_token, refresh_token, hashed_refresh_token = generate_tokens(user=db_response.data)
    db_connector.store_refresh_token(user_id=db_response.data.id, hashed_refresh_token=hashed_refresh_token)

    # stergem orice sesiune activa pe care o are utilizatorul
    db_connector.end_user_session(user_id=db_response.data.id)

    return access_token, refresh_token

# Ataseaza token-urile de acces si reimprospatare la un raspuns.
def set_response_auth_cookies(response:Response, access_token:str, refresh_token:str):

    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        expires=1 * 24 * 60 * 60,
        path="/",
    )

    response.set_cookie(
        key="refresh_token",
        value=f"{refresh_token}",
        httponly=True,
        expires=7 * 24 * 60 * 60,
        samesite="strict",
        path="/api/auth/refresh"
    )

    return response

EXP = 60


# Autentificare folosind username/email is parola.
# Campul "username" poate tine ori username-ul, ori email-ul utilizatorului
@router.post("/token", response_class=Response)
@limiter.limit("60/minute")
async def login(credentials: Annotated[OAuth2PasswordRequestForm, Depends()], request: Request, response:Response):

    logger.debug("User logging in.")

    if check_login_state(request):
        raise HTTPException(status_code=409,
                            detail="Already logged in.",
                            headers={"WWW-Authenticate": "Bearer"})

    access_token, refresh_token = create_session(identifier=credentials.username,
                                                password=credentials.password)

    # raspunsului ii adaugam un HTTPOnly cookie ce retine jetonul de acces. Acest Cookie e memorat in browser automat
    # si este adaugat la orice apel de API ulterior, pentru autentificare.
    response = set_response_auth_cookies(response=response,
                                    access_token=access_token,
                                    refresh_token=refresh_token)

    response.status_code = 200
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

        new_access_token, new_refresh_token, hashed_new_refresh_token = generate_tokens(user=user)

        db_connector.invalidate_refresh_token(hashed_ref_token=hashlib.sha256(refresh_token.encode()).hexdigest()) # Invalidam refresh token-ul vechi...
        db_connector.store_refresh_token(user_id=user.id,
                                         hashed_refresh_token=hashed_new_refresh_token) # ...si il stocam pe cel nou

        response = set_response_auth_cookies(response=response,
                                        access_token=new_access_token,
                                        refresh_token=new_refresh_token)

        response.status_code = 200
        return response

    logger.warning(check_response.message)
    raise HTTPException(status_code=401, detail="Refresh token invalid or not found (in db).")

# Cere crearea unui cod de verificare al unui email.
@router.put("/verification-code/request", status_code=200)
async def request_verification_code(req:VerificationCodeRequest):

    if not validate_email(req.email): raise HTTPException(status_code=404, detail="Invalid email.")

    # Daca emailul este deja folosit de un utilizator, nu se poate crea un alt cont cu el.
    find_user_result = db_connector.find_user(email=req.email)
    if find_user_result.ok(): raise HTTPException(status_code=409, detail="Email in use.")

    code:int = random.randint(100000, 999999)
    if send_verification_email(code, email=req.email):

        # Daca s-a reuist trimiterea codului de verificare, il stocam in baza de date
        db_connector.store_verification_code(str(code), email=req.email)

    else: raise HTTPException(status_code=500, detail="Verification code could not be sent.")

@router.put("/verification-code/check", status_code=200)
async def check_verification_code(req: VerifyEmailRequest, response: Response):

    invalid_code_exception = HTTPException(status_code=404, detail="Invalid code.")

    try:

        code:int = int(req.code)
        if 0 <= code <= 999999:

            # verificam validitatea codului
            check_code_response:DBResult[str|None] = db_connector.check_verification_code(verification_code=str(code), email=req.email)
            if check_code_response.ok() and check_code_response.data is not None:

                # stergem codul din baza de date
                db_connector.delete_verification_code(verification_code_id=check_code_response.data)

                response.status_code = 200
                return response

            else: raise HTTPException(status_code=check_code_response.status, detail=check_code_response.message)

        else: raise invalid_code_exception

    except ValueError: # daca codul nu este o valoare intreaga, e invalid
        raise invalid_code_exception


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


class GoogleUserData(BaseModel):
    email:str
    user_id:str

# Returneaza datele despre un utilizator google, folosind codul de acces pasat.
def get_google_user_data(google_code:str)->GoogleUserData:

    # Trebuie sa trimitem o cerere catre serverul de autentificare google pentru a primi datele legate de utilizator.
    url = "https://oauth2.googleapis.com/token"
    data = { # Payload-ul
        "code": google_code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": "postmessage",  # IMPORTANT !
        "grant_type": "authorization_code",
    }

    response = requests.post(url, data=data)
    if not response.ok: raise HTTPException(status_code=401, detail=f"Failed to exchange code: {response.text}")

    # Preluam jwt-ul de identificare...
    google_id_token = response.json().get("id_token")

    # ... si ii verificam autenticitatea
    user_info = id_token.verify_oauth2_token(
        google_id_token,
        google_requests.Request(),
        GOOGLE_CLIENT_ID,
        clock_skew_in_seconds=10
    )

    return GoogleUserData(
        email=user_info["email"],
        user_id=user_info["sub"]
    )

# Se ocupa de autentificarea/inregistrarea unui untilizator google
@router.post("/google", response_class=JSONResponse, status_code=200)
async def handle_google_user(handle_request: HandleGoogleUserRequest, request:Request, response:Response):


    if check_login_state(request):
        raise HTTPException(status_code=409,
                            detail="Already logged in.",
                            headers={"WWW-Authenticate": "Bearer"})

    user_data:GoogleUserData = get_google_user_data(handle_request.googleCode)

    logger.warning(user_data.email)

    user = db_connector.find_user(provider="google", provider_user_id=user_data.user_id, email=user_data.email).data
    if user: # Daca a fost gasit un utilizator cu detaliile specificate, autentificam utilizatorul

        logger.info(f"Found GOOGLE user with email {user_data.email}")

        access_token, refresh_token, hashed_refresh_token = generate_tokens(user)
        db_connector.end_user_session(user_id=user.id)
        db_connector.store_refresh_token(user_id=user.id, hashed_refresh_token=hashed_refresh_token)

        response = set_response_auth_cookies(response, access_token, refresh_token)

        response.status_code = 200
        return response


    user = db_connector.find_user(email=user_data.email).data
    if user: # Daca exista deja un utilizator cu acelasi email, legam contul deja existent cu contul google

        logger.info(f"Found user with email {user_data.email}")

        db_connector.link_user_account(user_id=user.id, provider="google", provider_user_id=user_data.user_id)

        access_token, refresh_token, hashed_refresh_token = generate_tokens(user)
        db_connector.end_user_session(user_id=user.id)
        db_connector.store_refresh_token(user_id=user.id, hashed_refresh_token=hashed_refresh_token)

        response = set_response_auth_cookies(response, access_token, refresh_token)

        response.status_code = 200
        return response


    # Daca nu a fost gasit un utilizator cu acest email, il inregistram ca si un utilizator google

    default_username = user_data.email.split("@")[0]
    user_id = db_connector.register_user(username=default_username,
                               password=None,
                               email=user_data.email,
                               provider="google",
                               provider_user_id=user_data.user_id).data

    if not user_id: raise HTTPException(status_code=500)

    # Totodata autentificam utilizatorul
    user = User(id=user_id,
                username=default_username,
                isAdmin=False, # Initial, utilizatorul nu este administrator, deci este sigur sa setam false
                email=user_data.email)

    access_token, refresh_token, hashed_refresh_token = generate_tokens(user)
    db_connector.end_user_session(user_id=user_id)
    db_connector.store_refresh_token(user_id=user_id, hashed_refresh_token=hashed_refresh_token)

    response = set_response_auth_cookies(response, access_token, refresh_token)

    response.status_code = 200
    return response


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


@router.delete("/me/delete", status_code=200)
@limiter.limit("60/minute")
async def delete_user(user:Annotated[User, Depends(authenticate)], request: Request, response: Response):

    db_connector.end_user_session(user_id=user.id)
    result:DBResult = db_connector.delete_user(user.id)

    if result.status == 200:

        # Important: Trebuiesc sterse cookie-urile
        response.delete_cookie(key="access_token")
        response.delete_cookie(key="refresh_token")

        response.status_code = 200
        return response
    else:
        raise HTTPException(status_code=401, detail=result.message)