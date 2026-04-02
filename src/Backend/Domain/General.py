from datetime import datetime, date
from enum import Enum
from typing import Optional, List, Literal

from pydantic import BaseModel

class Question(BaseModel):
    text: str
    type: Literal["text", "grid"]
    isOptional: bool

class GridQuestion(Question):
    choices:list[str]
    isMultipleChoice: bool

class TextQuestion(Question):
    maxChars:int

class Answer(BaseModel):
    type: Literal["text", "grid"]

class GridAnswer(Answer):
    choices:list[int]

class TextAnswer(Answer):
    text:str

class Submission(BaseModel):
    answers:list[TextAnswer|GridAnswer]

class Form(BaseModel):
    id:str
    name:str
    questions:list[TextQuestion|GridQuestion]

    dateCreated:Optional[datetime] = None
    datePublished:Optional[datetime] = None
    dateClosed:Optional[datetime] = None
    submissions:Optional[List[Submission]] = None

class NewForm(BaseModel):
    name: str
    questions:list[TextQuestion|GridQuestion]

class MinimalFormInfo(BaseModel):
    id:str
    name:str
    dateCreated:Optional[datetime]
    datePublished:Optional[datetime]
    dateClosed:Optional[datetime]
    submissionsCount:int