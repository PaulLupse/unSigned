from typing import Annotated

from fastapi import APIRouter, HTTPException, Depends
from pydantic.v1 import Json
from starlette.responses import JSONResponse

from src.backend.api.auth.Authenticator import authenticate
from src.backend.domain.auth import User
from src.backend.db.DBConnector import DBConnector, get_db, DBResult
from src.backend.domain.models import NewForm
from src.backend.domain.requests import EditFormRequest

router:APIRouter = APIRouter(prefix="/admin", tags=['admin'])

db_connector:DBConnector = get_db()


@router.post("/official-templates/create", status_code=201, response_class=JSONResponse)
async def create_official_template(new_template:NewForm, user:Annotated[User, Depends(authenticate)]):

    if not user.isAdmin:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    result: DBResult[str] = db_connector.create_template(
        name=new_template.name,
        questions=new_template.questions,
        owner_id = "official", status='official')

    if result.status != 201:
        raise HTTPException(status_code=result.status, detail=result.message)

    return JSONResponse(status_code=201, content={'formId':result.data})


@router.put("/official-templates/{template_id}/edit", status_code=200)
async def edit_official_template(template_id:str, edit_template_request:EditFormRequest, user:Annotated[User, Depends(authenticate)]):

    if not user.isAdmin:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    result: DBResult = db_connector.edit_template(
        template_id = template_id,
        new_name=edit_template_request.name,
        new_questions=edit_template_request.questions,
        user=user
    )

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)


@router.delete("/official-templates/{template_id}/delete", status_code=200)
async def delete_official_template(template_id:str, user:Annotated[User, Depends(authenticate)]):

    if not user.isAdmin:
        raise HTTPException(status_code=403, detail="Unauthorized.")

    result = db_connector.delete_template(template_id=template_id, user=user)

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)
