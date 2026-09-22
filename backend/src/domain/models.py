from datetime import datetime
from typing import Optional, List, Literal, Annotated

from pydantic import BeforeValidator

from src.api.BaseModel import BaseModel
from src.utilities import PyObjectId, PyObjectIdField

ELEM_TYPES = ("paragraph", "heading", "question")
QUESTION_TYPES = ("grid", "text")


class FormElement(BaseModel):
    elem_type: Literal[*ELEM_TYPES]


class Paragraph(FormElement):
    elem_type: Literal["paragraph"]
    text: str


class Heading(BaseModel):
    elem_type: Literal["heading"]
    text: str
    number: int


class Question(BaseModel):
    elem_type: Literal["question"]
    text: str
    question_type: Literal[*QUESTION_TYPES]
    is_optional: bool


class GridQuestion(Question):
    question_type: Literal["grid"]
    choices: list[str]
    is_multiple_choice: bool


class TextQuestion(Question):
    question_type: Literal["text"]
    max_chars: int


class Answer(BaseModel):
    type: Literal["text", "grid"]


class GridAnswer(Answer):
    choices: list[int]


class TextAnswer(Answer):
    text: str


class Submission(BaseModel):
    answers: list[Answer]

# Formatul minimal al unui formular.
# Acesta nu contine intrebarile sau submisiile aferente.
class MinimalForm(BaseModel):
    id: PyObjectId = PyObjectIdField
    name: str
    owner_id: str
    date_created: Optional[datetime]
    date_opened: Optional[datetime] = None
    date_closed: Optional[datetime] = None
    sub_count: Annotated[int, BeforeValidator(lambda submissions:
                                              len(submissions)
                                              if type(submissions) is list
                                              else submissions)]

class Form(BaseModel):
    id: PyObjectId = PyObjectIdField
    name: str
    questions: list[Question]
    owner_id: str

    date_created: Optional[datetime]
    date_opened: Optional[datetime] = None
    date_closed: Optional[datetime] = None
    submissions: Optional[List[Submission]] = None

    def to_minimal(self) -> MinimalForm:
        return MinimalForm(
            id=self.id,
            name=self.name,
            owner_id=self.owner_id,
            date_created=self.date_created,
            date_opened=self.date_opened,
            date_closed=self.date_closed,
            sub_count=len(self.submissions) if self.submissions else 0,
        )


class NewForm(BaseModel):
    name: str
    questions: list[Question]


# Reprezinta date cat de cat statistice despre raspunsurile la o anumita intrebare
class AnswerStatistic(BaseModel):
    engagement: float
    type: Literal['grid', 'text']


class TextQuestionAnswerStatistic(AnswerStatistic):
    type: Literal['text']
    avg_word_count: float
    frequent_words: list[str]


class GridQuestionAnswerStatistic(AnswerStatistic):
    type: Literal['grid']
    answer_rate: list[float]  # procentul de oameni care au ales o varianta de raspuns anume




class Template(BaseModel):
    id: PyObjectId = PyObjectIdField
    name: str
    questions: list[Question]
    owner_id: str
    status: Literal['private', 'public', 'official']


# Formatul minimal al unui șablon.
# Acesta nu contine intrebarile aferente.
class MinimalTemplate(BaseModel):
    id: PyObjectId = PyObjectIdField
    name: str
    question_count: int
    owner_id: str
