from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

from src.api.auth.Authenticator import authenticate
from src.api.Limiter import limiter
from src.domain.auth import User
from src.domain.requests import EditFormRequest
from src.db.DBConnector import get_db, DBResult, DBConnector
from src.domain.models import MinimalTemplateInfo, Template, NewForm

router:APIRouter = APIRouter(prefix='/templates', tags=['templates'])

db_connector:DBConnector = get_db()



@router.get("/mine", status_code=200, response_model=list[MinimalTemplateInfo])
@limiter.limit("60/minute")
async def get_my_templates(user:Annotated[User, Depends(authenticate)], request: Request):

    get_templates_response:DBResult[list[MinimalTemplateInfo]] = db_connector.get_templates(user.id, status = 'private')

    if get_templates_response.status != 200:
        raise HTTPException(status_code= get_templates_response.status, detail = get_templates_response.message)

    return get_templates_response.data


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
async def get_template(template_id:str, user:Annotated[User, Depends(authenticate)], request: Request):

    get_template_response:DBResult[Template] = db_connector.get_template(template_id, user=user)

    if get_template_response.status != 200:
        raise HTTPException(status_code=get_template_response.status, detail=get_template_response.message)

    return get_template_response.data


@router.post("/create", status_code=201, response_class=JSONResponse)
@limiter.limit("60/minute")
async def create_template(create_template_request:NewForm, user: Annotated[User, Depends(authenticate)], request: Request):

    create_template_response:DBResult[str] = db_connector.create_template(
        name=create_template_request.name,
        questions=create_template_request.questions,
        owner_id=user.id,
        status="private"
    )

    if create_template_response.status != 201:
        raise HTTPException(status_code= create_template_response.status, detail = create_template_response.message)


    return JSONResponse(status_code=201, content={"formId":create_template_response.data})


@router.put("/{template_id}/edit", status_code=200)
@limiter.limit("60/minute")
async def edit_template(template_id: str, edit_temp_req: EditFormRequest, request: Request, user:Annotated[User, Depends(authenticate)]):

    edit_template_response = db_connector.edit_template(
        template_id=template_id,
        new_name = edit_temp_req.name,
        new_questions = edit_temp_req.questions,
        user=user
    )

    if edit_template_response.status != 200:
        raise HTTPException(status_code=edit_template_response.status, detail=edit_template_response.message)


@router.delete("/{template_id}/delete", status_code=200)
@limiter.limit("60/minute")
async def delete_template(template_id:str, request: Request, user:Annotated[User, Depends(authenticate)]):

    delete_template_response = db_connector.delete_template(template_id, user)

    if delete_template_response.status != 200:
        raise HTTPException(status_code=delete_template_response.status, detail=delete_template_response.message)
