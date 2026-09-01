import os
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from jwt import ExpiredSignatureError, InvalidTokenError

from src.api.auth.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies
from src.config import SECURE_JWT_KEY, JWT_ALG
from src.db.DBConnector import DBConnector, get_db
from src.domain.auth import User

db_connector:DBConnector = get_db()

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="api/users/token")

# Verifica daca token-ul de autentificare este valid, si returneaza detaliile utilizatorului.
async def authenticate(token : Annotated[str, Depends(oauth2_scheme)])->User:

    # eroare daca validarea da rateuri
    validation_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, key=SECURE_JWT_KEY, algorithms=JWT_ALG)
        user_id = payload.get("sub")

        if user_id is None:
            raise validation_error

        db_response = db_connector.find_user(user_id = user_id)
        if db_response.status != 200: raise validation_error

        return User(
            id=user_id,
            username=payload.get("username"),
            isAdmin=payload.get('isAdmin'),
            email=payload.get("email"),
        )

    except ExpiredSignatureError:

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Acces token expired. Please log in again.",
                            headers={"WWW-Authenticate": "Bearer"})

    except InvalidTokenError as error:
        print(error)
        raise validation_error