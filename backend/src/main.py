from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from starlette.responses import FileResponse, RedirectResponse

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

import logging

from src.api.auth.OAuth2PasswordBearerWithCookie import OAuth2PasswordBearerWithCookies
from src.api.endpoints.users import router as users_router
from src.api.endpoints.auth import router as auth_router
from src.api.endpoints.sub_users import router as sub_users_router
from src.api.endpoints.admin import router as admin_router
from src.api.endpoints.templates import router as templates_router
from src.api.Limiter import limiter


logger = logging.getLogger('uvicorn.error')
logger.setLevel(logging.DEBUG)

oauth2_scheme = OAuth2PasswordBearerWithCookies(tokenUrl="token")

app = FastAPI()
app.include_router(users_router, prefix="/api")
app.include_router(sub_users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from src.api.handlers import validation_exception_handler as vse
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request:Request, exception : RequestValidationError):
    return await vse(request, exception)

from src.api.handlers import http_exception_handler as heh
@app.exception_handler(HTTPException)
async def http_exception_handler(request:Request, exception : HTTPException):
    return await heh(request, exception)



@app.get("/", response_class=RedirectResponse)
async def root():
    return RedirectResponse(url="/docs")

