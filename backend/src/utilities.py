import re
from copy import copy
from typing import Mapping, Any, Annotated, Optional, Union, Callable
from warnings import deprecated

from fastapi import FastAPI
from pydantic import BaseModel, BeforeValidator, Field, create_model, TypeAdapter, AliasChoices
from pydantic.fields import FieldInfo

email_pattern = re.compile("\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*")


def validate_email(email: str) -> bool:
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


def custom_openapi_spec(original_openapi:Callable[[],dict[str, Any]] , extra_schemas:Union):
    """
    Inlocuieste FastAPI.openapi, care genereaza schema openapi.\n
    Menita sa fie folosita cand este nevoie de anumite enumeratii sau modele de catre codul frontend, dar acestea nu
    sunt incluse in specificatia openapi (de exemplu, cand un model sau o enumeratie nu sunt folosite de vreun endpoint).

    :argument original_openapi: Metoda openapi a aplicatiei.
    :argument extra_schemas: Schemele (modele, enumeratii etc) ce doresc a fii adaugate.
    :return: Noua schemă openapi.
    """

    # app.openapi genereaza schema openapi. Metoda e apelata in mod automat, intern, dar o putem folosi si in acest caz.
    _original_openapi = original_openapi

    schema: dict[str, Any] = _original_openapi()

    extra = TypeAdapter(extra_schemas).json_schema(
        mode="serialization",
        ref_template="#/components/schemas/{model}",
    )

    schemas: dict[str, Any] = schema.setdefault("components", {}).setdefault("schemas", {})
    for name, definition in extra.get("$defs", {}).items():
        schemas.setdefault(name, definition)

    return schema


# Anotatie de tip custom folosita pentru modele pidantice reprezentand obiecte memorate in baza de date (mongodb),
# care necesita cast din ObjectId in str.
PyObjectId = Annotated[str, BeforeValidator(str)]
PyObjectIdField = Field(validation_alias=AliasChoices("id", "_id"), serialization_alias="id")
