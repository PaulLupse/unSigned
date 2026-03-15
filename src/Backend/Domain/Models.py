from datetime import date
from typing import Optional, List

from pydantic import BaseModel

class Question(BaseModel):
    text: str
    isOptional: bool

class GridQuestion(Question):
    choices:list[str]
    isMultipleChoice: bool

class TextQuestion(Question):
    maxChars:int

class GridAnswer(BaseModel):
    choices:list[int]

class TextAnswer(BaseModel):
    text:str

class Submission(BaseModel):
    answers:list[GridAnswer|TextAnswer]


class Form(BaseModel):
    name:str
    questions:list[TextQuestion|GridQuestion]
    key: str

    dateCreated:Optional[date] = None
    dateUpdated:Optional[date] = None
    submissions:Optional[List[Submission]] = None