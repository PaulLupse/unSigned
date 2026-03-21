from fastapi import APIRouter, status, HTTPException
from pyexpat.errors import messages
from starlette.responses import HTMLResponse, FileResponse, JSONResponse
from pydantic import BaseModel

from src.Backend.DB.DBConnector import Database

def get_db(url:str)->Database:
    try:
        return Database(url)
    except:
        raise HTTPException(status_code=500, detail="Internal Server Error")

MDB_URL = "mongodb://localhost:27017/"

db_connector:Database = get_db(MDB_URL)

router:APIRouter = APIRouter(prefix="/sub-users", tags=["sub-users"])

class UseKeyRequest(BaseModel):
    key:str

@router.post("/use-key", response_class=JSONResponse)
async def use_key(use_key_request_body:UseKeyRequest):

    associated_form, status_code = db_connector.use_key(use_key_request_body.key)

    if status_code == 404:
        return JSONResponse(status_code=404, content={"message":"Key not found."})
    if status_code == 409:
        return JSONResponse(status_code=409, content={"message":"Key used or expired."})
    if status_code == 410:
        return JSONResponse(status_code=410, content={"message":"Form deleted."})

    return JSONResponse(status_code=200,content={"message":"Queried successfully.", "form":associated_form.model_dump(mode='json')})


