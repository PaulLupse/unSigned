from fastapi import APIRouter, HTTPException

from src.backend.db.DBConnector import DBConnector, get_db, DBResult
from src.backend.domain.models import MinimalTemplateInfo, NewForm, Template
from src.backend.domain.requests import EditFormRequest

router:APIRouter = APIRouter(prefix="/admin", tags=['admin'])

db_connector:DBConnector = get_db()


@router.get("/templates", response_model=list[MinimalTemplateInfo], status_code=200)
async def get_default_templates():

    result:DBResult[list[MinimalTemplateInfo]] = db_connector.get_templates(owner_id="admin")

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


@router.get("/templates/{template_id}", response_model=Template)
async def get_default_template(template_id:str):

    result:DBResult[Template] = db_connector.get_template(template_id)

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


@router.post("/templates/create", status_code=200)
async def create_default_template(new_template:NewForm):

    result: DBResult[str] = db_connector.create_template(
        name=new_template.name,
        questions=new_template.questions,
        owner_id = "admin")

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return {"templateId":result.data}


@router.put("/templates/{template_id}/edit", status_code=200)
async def edit_default_template(template_id:str, edit_template_request:EditFormRequest):

    result: DBResult = db_connector.edit_template(
        template_id = template_id,
        new_name=edit_template_request.name,
        new_questions=edit_template_request.questions
    )

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)


@router.delete("/templates/{template_id}/delete", status_code=200)
async def delete_default_template(template_id:str):

    result = db_connector.delete_template(template_id=template_id)

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)
