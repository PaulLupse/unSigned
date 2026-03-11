from os import access

from fastapi.security import OAuth2PasswordBearer
from fastapi import Request, HTTPException

# clasa ce implementeaza autentificarea folosind jwt
# adaptata pentru autentificarea folosind HTTPOnly Cookies
class OAuth2PasswordBearerWithCookies(OAuth2PasswordBearer):

    # apelam constructorul superclasei (OAuth2PasswordBearer)
    def __init__(self, tokenUrl:str):
        super().__init__(tokenUrl = tokenUrl)

    # supradefinim 'apelarea' clasei, implementand functionalitatea de verificare a jwt-ului, ce trebuie memorat in cookie-ul 'access_token'
    async def __call__(self, request:Request):

        access_token:str = request.cookies.get("access_token")
        if access_token and (access_token != ""):
            access_token = access_token.split(' ')[1] # facem split deoarece se returneaza tokenu cu stringul "Bearer " alipit, ceea ce creeaza eroare la decodare (logic)

        # daca nu exista un token, atunci e bai
        if not access_token:
            raise HTTPException(
                status_code=401,
                detail="Could not authenticate",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return access_token


