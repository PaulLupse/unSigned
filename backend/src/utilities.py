import re
from typing import Mapping, Any, Annotated
from warnings import deprecated

from pydantic import BaseModel, BeforeValidator, Field

email_pattern = re.compile("\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*")

def validate_email(email:str)->bool:
    return bool(email_pattern.match(email))


# Incapsuleaza tipuri de actiuni (read/write) specifice operatiilor CRUD
class Action:

    @staticmethod
    def read(fn):
        def wrapper(*args, **kwargs):
            return fn(action="read", *args, **kwargs)
        return wrapper

    @staticmethod
    def write(fn):
        def wrapper(*args, **kwargs):
            return fn(action="write", *args, **kwargs)
        return wrapper


# Anotatie de tip custom folosita pentru modele pidantice reprezentand obiecte memorate in baza de date (mongodb),
# care necesita cast din ObjectId in str.
PyObjectId = Annotated[str, BeforeValidator(str)]
PyObjectIdField = Field(validation_alias="_id", serialization_alias="id")
