from typing import Annotated, Literal

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse

from src.api.BaseModel import BaseModel
from src.api.CamelCaseRoute import CamelCaseRoute
from src.api.auth.Authenticator import authenticate
from src.common import limiter
from src.domain.auth import User
from src.db.DBConnector import DBConnector
from src.db.DBResult import DBResult
from src.domain.models import TemplateSummary, Template, NewForm, NewTemplate, TemplateType, Action

router:APIRouter = APIRouter(prefix='/template',
                             tags=['template'],
                             route_class=CamelCaseRoute)

db_connector:DBConnector = DBConnector.get_db()


def check_template_authorization(
        action:Literal['read','write']):

    """
    Returneaza o functie ce verifica daca utilizatorul este autorizat pentru a accesa sablonul, menita sa fie folosita ca
    si o dependenta in endpoint-uri.
    Este necesar apelul acestei functii cu un argument specificand actiunea ('read' sau 'write'). Folosirea functiei in
    Sine ca si o dependenta duce la eroare.

    Utilizare: *template:Annotated[Template, Depends(check_template_authorization(* **'read'** *))]*

    :param action: Actiunea pe care o intreprinde endpoint-ul.
    :return: Functia de verificare, menita sa fie folosita ca si o dependenta
    """

    def wrapper(template_id: str,
        user: Annotated[User, Depends(authenticate)])->Template:

        """
        Verifica daca utilizatorul este autorizat pentru a accesa sablonul specificat. Returneaza sablonul in caz afirmativ,
        sau genereaza o exceptie HTTP.
        :param template_id: ID-ul sablonului
        :param user: Datele utilizatorului
        :return: Sablonul in discutie
        """

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
        if template.status == TemplateType.PRIVATE and not (template.owner_id == user.id):
            raise auth_exception

        elif template.status == TemplateType.OFFICIAL and (not user.is_admin and action == Action.READ):
            raise auth_exception

        if template.status == TemplateType.PUBLIC and not template.owner_id == user.id and action == Action.WRITE:
            raise auth_exception


        return get_template_response.data

    return wrapper


@router.get("/official", response_model=list[TemplateSummary], status_code=200)
@limiter.limit("60/minute")
async def get_official_templates(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[TemplateSummary]] = db_connector.get_templates(user.id, status ='official')

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)

    return result.data


@router.get("/public", response_model=list[TemplateSummary], status_code=200)
@limiter.limit("60/minute")
async def get_public_templates(user:Annotated[User, Depends(authenticate)], request: Request):

    result:DBResult[list[TemplateSummary]] = db_connector.get_templates(user.id, status ='public')

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


class CreateTemplateResult(BaseModel):
    template_id:str

@router.post("/create", status_code=201, response_model=CreateTemplateResult)
@limiter.limit("60/minute")
async def create_template(create_template_request:NewTemplate,
                          user: Annotated[User, Depends(authenticate)],
                          request: Request):

    result:DBResult[str] = db_connector.create_template(
        template=create_template_request,
        owner_id=user.id,
        status="private"
    )

    if not result.ok() or not result.data:
        raise HTTPException(status_code= result.status, detail = result.message)

    return CreateTemplateResult(template_id=result.data)


@router.put("/{template_id}/edit", status_code=200, dependencies=[
        Depends(check_template_authorization('write')),
        Depends(authenticate)
    ])
@limiter.limit("60/minute")
async def edit_template(template_id: str,
                        edit_temp_req: NewTemplate,
                        request: Request):

    edit_template_response = db_connector.edit_template(
        template_id=template_id,
        new_template_data=edit_temp_req
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
