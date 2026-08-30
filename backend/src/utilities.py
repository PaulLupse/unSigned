import re
from typing import Mapping, Any

from pydantic import BaseModel

email_pattern = re.compile("\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*")

def validate_email(email:str)->bool:
    return bool(email_pattern.match(email))

def format_mongodb_id_field(obj:Mapping[str, Any])->Mapping[str, Any]:

    if obj.get('_id') is None:
        raise ValueError("Object does not have _id field.")

    obj['id'] = str(obj.pop('_id'))
    return obj

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
