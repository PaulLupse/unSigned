from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

from src.api.auth.Authenticator import authenticate
from src.api.Limiter import limiter
from src.domain.auth import User
from src.domain.requests import EditFormRequest
from src.db.DBConnector import get_db, DBResult, DBConnector
from src.domain.models import MinimalTemplateInfo, Template, NewForm
from src.utilities import Action

router:APIRouter = APIRouter(prefix='/template', tags=['template'])

db_connector:DBConnector = get_db()

# Verifica daca utilizatorul este autorizat pentru a accesa sablonul. Returneaza chestionarul in caz afirmativ.
def check_template_authorization(
        action:Literal['read','write']):

    def wrapper(template_id: str,
        user: Annotated[User, Depends(authenticate)])->Template:

        get_template_response = db_connector.get_template(template_id=template_id)

        if not get_template_response.data:
            raise HTTPException(
                status_code=get_template_response.status,
                detail=get_template_response.message)



        auth_exception = HTTPException(
                status_code=403,
                detail="You are not allowed to access this resource."
            )

        template = get_template_response.data
        if template.status == "private" and not (template.ownerId == user.id):
            raise auth_exception

        elif template.status == "official" and (not user.isAdmin and action == "write"):
            raise auth_exception

        if template.status == "public" and not template.ownerId == user.id and action == "write":
            raise auth_exception


        return get_template_response.data

    return wrapper


@router.get("/official", response_model=list[MinimalTemplateInfo], status_code=200)
@limiter.limit("60/minute")
async def get_official_templates(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[MinimalTemplateInfo]] = db_connector.get_templates(user.id, status = 'official')

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


@router.get("/public", response_model=list[MinimalTemplateInfo], status_code=200)
@limiter.limit("60/minute")
async def get_public_templates(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[MinimalTemplateInfo]] = db_connector.get_templates(user.id, status = 'public')

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


@router.get("/{template_id}", response_model=Template)
@limiter.limit("60/minute")
async def get_template(template_id:str,
                       template:Annotated[Template, Depends(check_template_authorization("read"))],
                       user:Annotated[User, Depends(authenticate)], # Necesar pentru ^^^
                       request: Request):

    return template


@router.post("/create", status_code=201, response_class=JSONResponse)
@limiter.limit("60/minute")
async def create_template(create_template_request:NewForm,
                          user: Annotated[User, Depends(authenticate)],
                          request: Request):

    create_template_response:DBResult[str] = db_connector.create_template(
        name=create_template_request.name,
        questions=create_template_request.questions,
        owner_id=user.id,
        status="private"
    )

    if create_template_response.status != 201:
        raise HTTPException(status_code= create_template_response.status, detail = create_template_response.message)


    return JSONResponse(status_code=201, content={"formId":create_template_response.data})


@router.put("/{template_id}/edit", status_code=200, dependencies=[Depends(check_template_authorization('write'))])
@limiter.limit("60/minute")
async def edit_template(template_id: str,
                        edit_temp_req: EditFormRequest,
                        user:Annotated[User, Depends(authenticate)],
                        request: Request):

    edit_template_response = db_connector.edit_template(
        template_id=template_id,
        new_name = edit_temp_req.name,
        new_questions = edit_temp_req.questions,
        user=user
    )

    if edit_template_response.status != 200:
        raise HTTPException(status_code=edit_template_response.status, detail=edit_template_response.message)


@router.delete("/{template_id}/delete", status_code=200, dependencies=[Depends(check_template_authorization('write'))])
@limiter.limit("60/minute")
async def delete_template(template_id:str,
                          user:Annotated[User, Depends(authenticate)],
                          request: Request):

    delete_template_response = db_connector.delete_template(template_id, user)

    if delete_template_response.status != 200:
        raise HTTPException(status_code=delete_template_response.status, detail=delete_template_response.message)
