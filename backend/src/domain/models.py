from datetime import datetime
from enum import Enum
from typing import Optional, List, Literal, Annotated, Union

from pydantic import BeforeValidator, Field

from src.api.BaseModel import BaseModel
from src.utilities import PyObjectId, PyObjectIdField

class ElemType(str, Enum):

    """
    Tipurile de elemente ale unui formular, sub formă de string. Folosite pentru discriminarea între elementele
    ce moștenesc clasa FormElement.
    """

    PARAGRAPH = "paragraph"
    HEADING = "heading"
    QUESTION = "question"


class QuestionType(str, Enum):

    """
    Tipurile de întrebări ale unui formular, sub formă de string. Folosite pentru discriminarea între elementele
    ce moștenesc clasa Question.
    """

    GRID = "grid"
    TEXT = "text"


class TemplateType(str, Enum):

    """
    Tipurile de template-uri, sub formă de string.
    """

    PUBLIC = "public"
    PRIVATE = "private"
    OFFICIAL = "official"


class FormElement(BaseModel):

    """
    Clasa de baza pentru toate elementele unui formular (in afara de titlu).
    Attributes:
        elem_type: Discriminatorul intre tipurile de elemente.
    """

    elem_type: ElemType


class Paragraph(FormElement):
    elem_type: Literal[ElemType.PARAGRAPH] = ElemType.PARAGRAPH
    text: str


class Heading(BaseModel):
    elem_type: Literal[ElemType.HEADING] = ElemType.HEADING
    text: str
    number: int


class Question(BaseModel):

    """
    Clasa de baza pentru toate intrebarile unui formular.
    Attributes:
        question_type: Discriminatorul intre tipurile de intrebari.
    """

    elem_type: Literal[ElemType.QUESTION] = ElemType.QUESTION

    text: str
    question_type: QuestionType
    is_optional: bool


class GridQuestion(Question):
    question_type: Literal[QuestionType.GRID] = QuestionType.GRID
    choices: list[str]
    is_multiple_choice: bool


class TextQuestion(Question):
    question_type: Literal[QuestionType.TEXT] = QuestionType.TEXT
    max_chars: int


QuestionUnion = Annotated[Union[TextQuestion, GridQuestion], Field(discriminator="question_type")]

FormElementUnion = Annotated[Union[QuestionUnion, Paragraph, Heading], Field(discriminator="elem_type")]


class Answer(BaseModel):

    """
    Clasa de baza pentru un raspuns la o intrebare particulară.
    Discriminarea între tipuri se realizează prin atributul type.
    """

    type: QuestionType


class GridAnswer(Answer):
    type: Literal[QuestionType.GRID] = QuestionType.GRID
    choices: list[int]


class TextAnswer(Answer):
    type: Literal[QuestionType.TEXT] = QuestionType.TEXT
    text: str


AnswerUnion = Annotated[Union[TextAnswer, GridAnswer], Field(discriminator="type")]


class Submission(BaseModel):

    """
    Clasă reprezentând o submisie pentru un formular.
    """

    answers: list[Answer]


class BaseForm(BaseModel):

    id: PyObjectId = PyObjectIdField
    name: str
    owner_id: str
    date_created: Optional[datetime]
    date_opened: Optional[datetime] = None
    date_closed: Optional[datetime] = None


class FormSummary(BaseForm):
    """
    Formatul minimal al unui formular. NU contine intrebarile aferente si submisiile.
    """

    sub_count: Annotated[int, BeforeValidator(lambda submissions:
                                              len(submissions)
                                              if type(submissions) is list
                                              else submissions)]


class Form(BaseForm):

    elements: list[FormElementUnion]
    submissions: Optional[List[Submission]] = None

    def summarize(self) -> FormSummary:

        """
        Metodă de utilitate ce convertește un formular la formatul minimal.
        :return: Formatul minimal al formularului.
        """

        return FormSummary(
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
    elements: list[FormElementUnion]


class NewTemplate(BaseModel):
    name: str
    elements: list[FormElementUnion]


# Reprezinta date cat de cat statistice despre raspunsurile la o anumita intrebare
class QuestionStatistic(BaseModel):

    """
    Clasa de baza pentru statistici legate de o singura intrebare.
    """

    engagement: float
    type: QuestionType


class TextQuestionStatistic(QuestionStatistic):

    """
    Statistici legate de raspunsurile pentru o singura intrebare de tip text.
    """

    type: QuestionType = QuestionType.TEXT
    avg_word_count: float
    frequent_words: list[str]


class GridQuestionStatistic(QuestionStatistic):

    """
    Statistici legate de raspunsurile pentru o singura intrebare de tip grilă.
    """

    type: QuestionType = QuestionType.GRID
    answer_rate: list[float]  # procentul de oameni care au ales o varianta de raspuns anume


QuestionStatisticUnion = Annotated[Union[GridQuestionStatistic, TextQuestionStatistic], Field(discriminator="type")]


class BaseTemplate(BaseModel):

    id: PyObjectId = PyObjectIdField
    name: str
    owner_id: str
    status: TemplateType


class TemplateSummary(BaseTemplate):
    """
    Formatul minimal al unui template. NU contine intrebarile aferente.
    """

    question_count: int


class Template(BaseTemplate):

    elements: list[FormElement]

    def summarize(self) -> TemplateSummary:

        """
        Metodă de utilitate ce convertește un template la formatul minimal.
        :return: Formatul minimal al template-ului.
        """

        return TemplateSummary(
            id=self.id,
            name=self.name,
            owner_id=self.owner_id,
            question_count=len([elem for elem in self.elements if elem.elem_type is ElemType.QUESTION]) if self.elements else 0,
            status=self.status
        )



