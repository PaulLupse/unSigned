from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from starlette.responses import FileResponse

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

import logging

from src.Backend.API.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies
from src.Backend.API.User import router as users_routes
from src.Backend.API.SubUsers import router as sub_users_routes
from src.Backend.API.Limiter import limiter


logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="token")

app = FastAPI()
app.include_router(users_routes, prefix="/api")
app.include_router(sub_users_routes, prefix="/api")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
@app.get("/{catchall:path}", response_class=HTMLResponse)
async def not_found():
    return FileResponse("static/html/index.html")

