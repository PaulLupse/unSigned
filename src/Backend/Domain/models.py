from datetime import datetime
from typing import Optional, List, Literal

from pydantic import BaseModel

class Question(BaseModel):
    text: str
    type: Literal["text", "grid"]
    isOptional: bool

class GridQuestion(Question):
    type: Literal["grid"]
    choices:list[str]
    isMultipleChoice: bool

class TextQuestion(Question):
    type: Literal["text"]
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

# reprezinta date cat de cat statistice despre raspunsurile la o anumita intrebare
class AnswerStatistic(BaseModel):

    engagement: float
    type:Literal['grid', 'text']

class TextQuestionAnswerStatistic(AnswerStatistic):

    type:Literal['text']
    avgWordCount:float
    frequentWords:list[str]

class GridQuestionAnswerStatistic(AnswerStatistic):

    type:Literal['grid']
    answerRate:list[float] # procentul de oameni care au ales o varianta de raspuns anume


class MinimalFormInfo(BaseModel):
    id:str
    name:str
    dateCreated:Optional[datetime]
    datePublished:Optional[datetime]
    dateClosed:Optional[datetime]
    submissionsCount:int

class Template(BaseModel):

    id:str
    name:str
    questions:list[GridQuestion|TextQuestion]
    ownerId:str

class MinimalTemplateInfo(BaseModel):

    id:str
    name:str
    questionCount:int
    ownerId:str