from fastapi import Request, status, APIRouter
from fastapi.exceptions import RequestValidationError, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse


async def validation_exception_handler(request:Request, exception : RequestValidationError):

    message:str = "Validation errors"
    for error in exception.errors():
        message += f"\nField: {error['loc']}, Error: {error['msg']}"

    print("DEBUG: \t", message)
    return JSONResponse(content={"message":message}, status_code=status.HTTP_400_BAD_REQUEST)

async def http_exception_handler(request:Request, exception : HTTPException):

    message:str = exception.detail

    print("DEBUG:\t", message)
    return JSONResponse(content={"message":message}, status_code=exception.status_code)