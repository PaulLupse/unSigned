from fastapi import APIRouter, HTTPException, Request
from fastapi.params import Depends
from fastapi.responses import JSONResponse
from fastapi.routing import APIRoute

from typing import Annotated

from src.api.BaseModel import BaseModel
from src.api.CamelCaseRoute import CamelCaseRoute
from src.api.auth.Authenticator import authenticate
from src.domain.models import TextQuestionStatistic, GridQuestionStatistic
from src.db.DBResult import DBResult
from src.api.requests import EditFormRequest
from src.common import limiter
from src.api.KeyDistributor import distribute_keys
from src.domain.auth import User
from src.domain.models import NewForm, Form
from src.db.DBConnector import DBConnector, get_db

db_connector:DBConnector = get_db()

router:APIRouter = APIRouter(prefix="/form",
                             tags=["forms"],
                             route_class=CamelCaseRoute)

class TokenData(BaseModel):
    username:str


# Verifica daca utilizatorul este autorizat pentru a accesa chestionarul. Returneaza chestionarul in caz afirmativ.
def check_form_authorization(
        form_id:str,
        user:Annotated[User, Depends(authenticate)])->Form:

    user_id = user.id

    get_form_response = db_connector.get_form(form_id=form_id)

    if not get_form_response.data:
        raise HTTPException(
            status_code=get_form_response.status,
            detail=get_form_response.message)

    if not get_form_response.data.owner_id == user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to access this resource."
        )

    return get_form_response.data

class CreateFormResponse(BaseModel):

    form_id:str

@router.post("/add", status_code=201, response_model=CreateFormResponse)
@limiter.limit("60/minute")
async def create_form(user:Annotated[User, Depends(authenticate)],
                      new_form:NewForm,
                      request: Request):

    result:DBResult[str] = db_connector.add_form(new_form, user.id)
    if not result.ok() or not result.data:
        raise HTTPException(status_code=result.status, detail=result.message)

    return CreateFormResponse(form_id=result.data)


@router.post("/{form_id}/open", status_code=200, dependencies=[Depends(check_form_authorization)])
@limiter.limit("60/minute")
async def open_form(form_id: str,
                    user:Annotated[User, Depends(authenticate)],
                    request: Request):

    result:DBResult = db_connector.open_form(form_id, owner_id=user.id)

    if not result.ok():
        raise HTTPException(status_code=result.status, detail=result.message)


@router.post("/{form_id}/close", status_code=200, dependencies=[Depends(check_form_authorization)])
@limiter.limit("60/minute")
async def close_form(form_id: str,
                     request: Request,
                     user:Annotated[User, Depends(authenticate)]):

    result:DBResult = db_connector.close_form(form_id, user.id)

    if result.status != 200:
        raise HTTPException(status_code=result.status, detail=result.message)


@router.get("/{form_id}", response_model=Form, status_code=200)
@limiter.limit("60/minute")
async def get_form(form_id:str,
                   user:Annotated[User, Depends(authenticate)], # Necesar pt functia "check_form_authorization"!
                   form:Annotated[Form, Depends(check_form_authorization)],
                   request:Request):

    return form


@router.put("/{form_id}/edit", dependencies=[Depends(authenticate)], status_code=200)
@limiter.limit("60/minute")
async def edit_form(form_id: str,
                    edit_form_request:EditFormRequest,
                    user:Annotated[User, Depends(authenticate)],
                    form:Annotated[Form, Depends(check_form_authorization)],
                    request:Request):

    if form and form.date_opened is not None:
        raise HTTPException(
            status_code=409,
            detail="Published forms cannot be edited.")

    edit_form_result:DBResult = db_connector.edit_form(
                                            form_id,
                                            new_title=edit_form_request.name,
                                            new_questions=edit_form_request.questions,
                                            owner_id=user.id)

    if edit_form_result.status != 200:
        raise HTTPException(
            status_code=edit_form_result.status,
            detail=edit_form_result.message)


@router.delete("/{form_id}/delete", status_code=200, dependencies=[Depends(check_form_authorization)])
@limiter.limit("60/minute")
async def delete_form(form_id:str,
                      user:Annotated[User, Depends(authenticate)],
                      request: Request):

    result: DBResult = db_connector.delete_form(form_id, user.id)

    if not result.ok():
        raise HTTPException(
            status_code=result.status,
            detail=result.message)


@router.get("/{form_id}/submission-data", response_model=list[TextQuestionStatistic | GridQuestionStatistic])
async def get_form_submission_data(form_id:str,
                                   user:Annotated[User, Depends(authenticate)],
                                   form:Annotated[Form, Depends(check_form_authorization)],
                                   request: Request):

    sub_data_res:DBResult[list[TextQuestionStatistic | GridQuestionStatistic]] = (
        db_connector.get_submission_data(
            form_id=form_id,
            owner_id=user.id,
            form=form
        ))

    if sub_data_res.status != 200:
        raise HTTPException(
            status_code=sub_data_res.status,
            detail=sub_data_res.message)

    return sub_data_res.data


class Email(BaseModel):
    email: str

class DistributeKeysRequest(BaseModel):
    emails:list[Email]

# Trimite chei de access la formularul cu id-ul specificat, email-urilor specificate.
@router.post("/{form_id}/distribute_keys", status_code=200, dependencies=[Depends(check_form_authorization)])
@limiter.limit("60/minute")
async def distribute_form_keys(dist_key_req:DistributeKeysRequest,
                               user : Annotated[User, Depends(authenticate)],
                               form_id:str,
                               request: Request):

    await distribute_keys(emails=[email.email for email in dist_key_req.emails],
                          form_owner_username=user.username,
                          form_id = form_id)
