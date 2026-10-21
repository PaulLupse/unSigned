from datetime import datetime
from enum import Enum
from typing import Optional, List, Literal, Annotated, Union, TypeAliasType

from pydantic import BeforeValidator, Field, AwareDatetime

from src.api.BaseModel import BaseModel, RootModel
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

    MC = "mc"
    TEXT = "text"


class TemplateType(str, Enum):

    """
    Tipurile de template-uri, sub formă de string.
    """

    PUBLIC = "public"
    PRIVATE = "private"
    OFFICIAL = "official"


class Action(str, Enum):
    READ = 'read'
    WRITE = 'write'


class FormElement(BaseModel):
    """
    Modelul de bază pentru toate elementele dinamice ale unui formular.
    Attributes:
        elem_type: Discriminatorul intre tipurile de elemente.
        id: Identificatorul elementului (un id de 6 caractere)
    """
    elem_type: ElemType
    id:str = Field(min_length=6, max_length=6)


class Paragraph(FormElement):
    """
    Un paragraf, cu rol informativ pentru persoana ce completează formularul.
    Attributes:
        text: Textul paragrafului.
    """
    elem_type: Literal[ElemType.PARAGRAPH] # = ElemType.PARAGRAPH
    text: str


class Heading(BaseModel):
    """
    Un subtitlu, cu rol delimitator și informativ pentru persoana ce completează formularul.
    Attributes:
        text: Textul subtitlului.
    """
    elem_type: Literal[ElemType.HEADING] # = ElemType.HEADING
    text: str


class Question(BaseModel):
    """
    Clasa de baza pentru toate intrebarile unui formular.
    Attributes:
        question_type: Discriminatorul intre tipurile de intrebari.
        text: Textul întrebării.
        is_optional: Flag ce semnalează opționalitatea întrebării.
    """
    elem_type: Literal[ElemType.QUESTION] # = ElemType.QUESTION

    text: str
    question_type: QuestionType
    is_optional: bool = False


class MCQuestionChoice(BaseModel):
    """
    O variantă de răspuns, specifică unei întrebări cu răspunsuri multiple.
    Attributes:
        id: Identificatorul variantei.
        label: Textul variantei de răspuns.
    """
    id: int
    label: str


class MCQuestion(Question):
    """
    (MC = Multiple Choice) O întrebare cu mai multe răspunsuri.
    Attributes:
        choices: Variantele de răspuns.
        is_multiple_select: Flag ce semnalează dacă se pot selecta două sau mai multe de o variante de răspuns în același timp.
    """
    question_type: Literal[QuestionType.MC] # = QuestionType.MC
    choices: list[MCQuestionChoice]
    is_multiple_select: bool


class TextQuestion(Question):
    """
    Întrebare cu răspuns de tip text.
    Attributes:
        max_chars: Numărul maxim de caractere permis
    """
    question_type: Literal[QuestionType.TEXT] # = QuestionType.TEXT
    max_chars: int


class QuestionUnion(RootModel[ Annotated[Union[TextQuestion, MCQuestion], Field(discriminator="question_type")]]):
    pass


class FormElementUnion (RootModel[Annotated[Union[QuestionUnion, Paragraph, Heading], Field(discriminator="elem_type")]]):
    pass


class Answer(BaseModel):
    """
    Clasa de baza pentru un raspuns la o intrebare particulară.
    Attributes:
        type: Discriminatorul intre tipurile de răspunsuri.
    """
    type: QuestionType
    question_id: str = Field(min_length=6, max_length=6)


class MCAnswer(Answer):
    """
    Răspuns la o întrebare cu variante multiple de răspuns.
    Attributes:
        choices: Lista id-urilor răspunsurilor alese.
    """
    type: Literal[QuestionType.MC] # = QuestionType.GRID
    choices: list[int]


class TextAnswer(Answer):
    """
    Răspuns la o întrebare de tip text.
    Attributes:
        text: Răspunsul, sub formă de text.
    """
    type: Literal[QuestionType.TEXT] # = QuestionType.TEXT
    text: str


class AnswerUnion (RootModel[Annotated[Union[TextAnswer, MCAnswer], Field(discriminator="type")]]):
    pass


class Submission(BaseModel):
    """
    Clasă reprezentând o submisie pentru un formular.
    Attributes:
        answers: Lista răspunsurilor.
    """
    answers: list[AnswerUnion]


class BaseForm(BaseModel):

    """
    Forma de bază a unui formular.
    """

    id: PyObjectId = PyObjectIdField
    title: str
    owner_id: str
    date_created: Optional[AwareDatetime]
    date_opened: Optional[AwareDatetime] = None
    date_closed: Optional[AwareDatetime] = None


class FormSummary(BaseForm):
    """
    Formatul minimal al unui formular. NU contine intrebarile aferente si submisiile.
    Attributes:
        sub_count: Numărul de submisii.
    """

    sub_count: Annotated[int, BeforeValidator(lambda submissions:
                                              len(submissions)
                                              if type(submissions) is list
                                              else submissions)]


class Form(BaseForm):
    """
    Formatul complet al unui formular.
    """
    elements: list[FormElementUnion]
    submissions: Optional[List[Submission]] = None

    def summarize(self) -> FormSummary:

        """
        Metodă de utilitate ce convertește un formular la formatul minimal.
        :return: Formatul minimal al formularului.
        """

        return FormSummary(
            id=self.id,
            title=self.title,
            owner_id=self.owner_id,
            date_created=self.date_created,
            date_opened=self.date_opened,
            date_closed=self.date_closed,
            sub_count=len(self.submissions) if self.submissions else 0,
        )


class NewForm(BaseModel):
    """
    Formă 'primitivă' al unui formular.
    """
    title: str
    elements: list[FormElementUnion]


class NewTemplate(BaseModel):
    """
    Formă 'primitivă' al unui șablon.
    """
    title: str
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

    type: Literal[QuestionType.TEXT]  = QuestionType.TEXT
    avg_word_count: float
    frequent_words: list[str]


class MCQuestionStatistic(QuestionStatistic):

    """
    Statistici legate de raspunsurile pentru o singura intrebare de tip grilă.
    """

    type: Literal[QuestionType.MC] # = QuestionType.GRID
    answer_rate: list[float]  # procentul de oameni care au ales o varianta de raspuns anume


class QuestionStatisticUnion (RootModel[Annotated[Union[MCQuestionStatistic, TextQuestionStatistic], Field(discriminator="type")]]):
    pass


class BaseTemplate(BaseModel):

    """
    Forma de bază a unui șablon.
    """

    id: PyObjectId = PyObjectIdField
    title: str
    owner_id: str
    status: TemplateType


class TemplateSummary(BaseTemplate):
    """
    Formatul minimal al unui șablon. NU contine intrebarile aferente.
    """

    question_count: int


class Template(BaseTemplate):
    """
    Forma completă al unui șablon.
    """
    elements: list[FormElementUnion]

    def summarize(self) -> TemplateSummary:

        """
        Metodă de utilitate ce convertește un template la formatul minimal.
        :return: Formatul minimal al template-ului.
        """

        return TemplateSummary(
            id=self.id,
            title=self.title,
            owner_id=self.owner_id,
            question_count=len([elem for elem in self.elements if elem.elem_type is ElemType.QUESTION]) if self.elements else 0,
            status=self.status
        )



