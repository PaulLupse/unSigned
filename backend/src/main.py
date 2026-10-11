from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from typing import Union, Annotated, TypeAliasType
from pydantic import TypeAdapter, Field

from starlette.responses import RedirectResponse

from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from src.api.endpoints.form import router as forms_router
from src.api.endpoints.user import router as users_router
from src.api.endpoints.auth import router as auth_router
from src.api.endpoints.sub_user import router as sub_users_router
from src.api.endpoints.admin import router as admin_router
from src.api.endpoints.template import router as templates_router
from src.common import limiter
from src.domain.models import TemplateType, ElemType, QuestionType, FormElementUnion, QuestionUnion, QuestionStatistic, \
    QuestionStatisticUnion, Paragraph, Heading
from src.utilities import custom_openapi_spec, PyObjectIdField, PyObjectId

app = FastAPI()
app.include_router(users_router, prefix="/api")
app.include_router(forms_router, prefix="/api")
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

# Adăugăm enumerațiile la schema openapi, întrucât s-ar putea să nu fie incluse.
EXTRA_SCHEMAS = Union[TemplateType, ElemType, QuestionType, FormElementUnion, QuestionUnion, QuestionStatisticUnion]
_original_openapi = app.openapi
app.openapi = lambda:custom_openapi_spec(_original_openapi, EXTRA_SCHEMAS)

app.separate_input_output_schemas = False

@app.get("/", response_class=RedirectResponse)
async def root():
    return RedirectResponse(url="/docs")

