from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse

from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles

import logging

from src.Backend.API.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies
from src.Backend.API.User import router as users_routes


logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="token")

app = FastAPI()
app.mount("/static/html", StaticFiles(directory="static/html"), name="html") # HTML
app.mount("/static/css", StaticFiles(directory="static/css"), name="css") # CSS
app.mount("/dist", StaticFiles(directory="dist"), name="dist") # TSX
app.include_router(users_routes)



from src.Backend.API.Handlers import validation_exception_handler as vse
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request:Request, exception : RequestValidationError):
    return await vse(request, exception)

from src.Backend.API.Handlers import http_exception_handler as heh
@app.exception_handler(HTTPException)
async def http_exception_handler(request:Request, exception : HTTPException):
    return await heh(request, exception)



@app.get("/", response_class=HTMLResponse)
async def root():
    return FileResponse("static/html/index.html")

@app.get("/login", response_class=FileResponse)
async def login_page():
    return FileResponse("static/html/login.html")

@app.get("/register")
async def register_page():
    return FileResponse("static/html/register.html")

@app.get("/create-new-item")
async def create_new_item():
    return FileResponse("static/html/create-new-item.html")


