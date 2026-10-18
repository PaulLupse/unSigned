import re
from collections import Counter
from typing import Literal

from warnings import deprecated
import pymongo.errors
from bson import ObjectId, CodecOptions
from fastapi.encoders import jsonable_encoder
from pydantic import TypeAdapter, ValidationError

from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import DeleteResult, InsertOneResult

from src.common import mongo_client
from src.db.DBResult import DBResult
from src.domain.models import TextAnswer, TextQuestionStatistic, MCQuestionStatistic, MCAnswer, \
    NewTemplate, QuestionType, Answer, ElemType, QuestionUnion, QuestionStatisticUnion
from src.domain.models import TemplateSummary, Template
from src.domain.models import TextQuestion, MCQuestion
from src.domain.models import Form, Submission, FormSummary, NewForm
from src.domain.auth import Key, User, UserStats

from datetime import date, datetime


class DBConnector:

    def __init__(self):
        try:
            database = mongo_client.get_database("db-chestionare")

            opt = CodecOptions(tz_aware=True)

            self.forms_table = database.get_collection("forms", codec_options=opt)
            self.keys_table = database.get_collection("keys", codec_options=opt)
            self.templates_table = database.get_collection("templates", codec_options=opt)
            self.verification_codes_table = database.get_collection("verification_codes", codec_options=opt)

        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout. Check backend-connection connection.")
            raise e

    @staticmethod
    def get_db():
        try:
            return DBConnector()
        except Exception as e:
            raise Exception("Unexpected error: " + str(e))

    def get_user_stats(self, user_id: str) -> DBResult[UserStats]:

        form_count: int = self.forms_table.count_documents(filter={"owner_id": user_id})
        template_count: int = self.templates_table.count_documents(filter={"owner_id": user_id})

        return DBResult(200, "Ok", UserStats(form_count=form_count, template_count=template_count))

    # adauga un formular, returneaza id-ul
    def add_form(self, new_form: NewForm, owner_id: str) -> DBResult[str]:

        try:

            current_date: date = datetime.now()

            new_form_dict = new_form.model_dump(mode="json")
            new_form_dict['date_created'] = current_date
            new_form_dict['submissions'] = []
            new_form_dict['owner_id'] = owner_id

            result: InsertOneResult = self.forms_table.insert_one(new_form_dict)

            return DBResult[str](201, "Created.", data=str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:
            return DBResult(409, "Form with this name already exists.")

    # seteaza proprietatea de publicare a unui formular la 'true'
    def open_form(self, form_id: str, owner_id: str) -> DBResult:

        form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id), "owner_id": owner_id})
        if not form_from_db: return DBResult(404, "Form not found.")

        form = Form.model_validate(form_from_db)

        if form.date_closed: return DBResult(409, "Form closed.")

        self.forms_table.update_one({"_id": ObjectId(form_id)},
                                    update={"$set": {"date_opened": datetime.now().isoformat()}})
        return DBResult(200, "Published.")

    # 'inchide' un chestionar.
    # Un chestionar inchis nu mai accepta raspunsuri.
    def close_form(self, form_id: str, owner_id: str) -> DBResult:

        form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id), "owner_id": owner_id})
        if not form_from_db: return DBResult(404, "Form not found.")

        form = Form.model_validate(form_from_db)

        if form.date_opened is None: DBResult(409, "Form not published.")

        self.forms_table.update_one({"_id": ObjectId(form_id)},
                                    update={"$set": {"date_closed": datetime.now().isoformat()}})
        return DBResult(200, "Closed.")

    # returneaza o lista de date minimale ale formularelor
    def get_forms(self, owner_id: str) -> DBResult[list[FormSummary]]:

        # validam lista de formulare returnata de baza de date
        forms_from_db = list(self.forms_table.find({"owner_id": owner_id}))

        forms = TypeAdapter(list[Form]).validate_python(forms_from_db)

        minimal_forms: list[FormSummary] = TypeAdapter(list[FormSummary]).validate_python(
            [form.summarize() for form in forms])

        return DBResult(200, "Queried successfully.", minimal_forms)

    # sterge un chestionar pe baza id-ului
    def delete_form(self, form_id: str, owner_id: str) -> DBResult:

        delete_result: DeleteResult = self.forms_table.delete_one({"_id": ObjectId(form_id), "owner_id": owner_id})
        if delete_result.deleted_count:
            return DBResult(200, "Deleted.")

        return DBResult(404, "Form not found.")

    # returneaza un singur formular
    def get_form(self, form_id: str) -> DBResult[Form]:

        if not ObjectId.is_valid(form_id):
            return DBResult(400, "Bad form id.")

        form_from_db = self.forms_table.find_one(
            {
                "_id": ObjectId(form_id)
            }
        )

        if form_from_db:
            form: Form = Form.model_validate(form_from_db)

            return DBResult(200, "Queried successfully.", form)

        return DBResult(404, "Form not found.")

    # verifica daca cheia de access la un chestionar este folosita
    def check_key_usage(self, key: Key) -> bool:

        if key.footer:
            found_key = self.keys_table.find_one({"_id": key.footer.key_id})
        else:
            raise ValueError("Key does not have a footer.")

        if found_key:
            return True
        return False

    # memoreaza id-ul cheii in baza de date
    def use_key(self, key: Key) -> DBResult:

        if key.footer:
            self.keys_table.insert_one({"_id": key.footer.key_id})
        else:
            return DBResult(500, "Key does not have footer.")

        return DBResult(200, "Done.")

    # inregistreaza un raspuns pentru un formular
    def submit_form_answer(self, form_id: str, submission: Submission) -> DBResult:

        self.forms_table.update_one({"_id": ObjectId(form_id)},
                                    {"$push": {"submissions": submission.model_dump(mode="json")}})
        return DBResult(200, "Submitted.")

    # verifica daca formularul exista
    def check_form_existence(self, form_id: str, owner_id: str | None = None) -> bool:

        filter_params: dict = {"_id": ObjectId(form_id)}
        if owner_id:
            filter_params['owner_id'] = owner_id

        if self.forms_table.find_one(filter_params):
            return True
        return False

    # modifica formularul prin atribuirea noilor intrebari sau a noului titlu
    # un formular nu poate fii modificat daca este deja publicat
    def edit_form(self,
                  form_id: str,
                  owner_id: str,
                  new_form_data: NewForm):

        try:

            result = self.forms_table.update_one(
                {"_id": ObjectId(form_id), "owner_id": owner_id},
                {
                    "$set": new_form_data.model_dump()
                }
            )

            if result.modified_count == 0: return DBResult(404, "Form not found.")

            return DBResult(200, "Updated.")

        except Exception as e:

            return DBResult(500, "Unexpected error: " + str(e))

    # Returneaza template-urile utilizatorului sub format minimal
    def get_templates(self,
                      owner_id: str,
                      status: Literal['public', 'private', 'official']) -> DBResult[list[TemplateSummary]]:

        try:

            if status == 'private':
                templates_from_db = self.templates_table.find({"owner_id": owner_id, 'status': 'private'})
            elif status == 'official':
                templates_from_db = self.templates_table.find({"status": 'official'})
            else:
                templates_from_db = self.templates_table.find({'status': 'public'})

            templates = [t for t in templates_from_db]

            template_list: list[TemplateSummary] =  [Template.model_validate(template).summarize()
                                                    for template in templates]

            return DBResult[list[TemplateSummary]](status=200, message="Queried successfully.", data=template_list)

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    @deprecated("Este recomandată verificarea autorizării în endpoint-ul api.")
    def check_template_authorization(self,
                                     template_id: str,
                                     owner_id: str,
                                     is_admin: bool,
                                     req: Literal['read', 'write']) -> DBResult[Template]:

        try:

            if not ObjectId.is_valid(template_id): return DBResult(400, "Invalid template id.")

            template_from_db = self.templates_table.find_one({"_id": ObjectId(template_id)})

            if template_from_db is None: return DBResult(404, "Template not found.")

            if template_from_db['owner_id'] != owner_id:
                if template_from_db['status'] == 'private':
                    return DBResult(403, "Unauthorized.")
                if template_from_db['status'] == 'official' and req == 'write' and not is_admin:
                    return DBResult(403, "Unauthorized.")

            template: Template = Template.model_validate(template_from_db)

            return DBResult(200, "Ok.", template)

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    # returneaza un template dupa id
    def get_template(self, template_id: str) -> DBResult[Template]:

        try:

            template_from_db = self.templates_table.find_one(
                {"_id": ObjectId(template_id)})

            if template_from_db is None: return DBResult(404, "Template not found.")

            template: Template = Template.model_validate(template_from_db)

            return DBResult(200, "Ok.", template)

        except ValidationError as e:
            return DBResult(500, "Database error: " + str(e))

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    # verifica existenta unui template
    def check_template_existence(self, template_id: str) -> bool:

        if self.templates_table.find_one({"_id": template_id}):
            return True
        return False


    def create_template(self,
                        template: NewTemplate,
                        owner_id: str,
                        status: Literal['public', 'private', 'official']) -> DBResult[str]:

        """
        Memoreaza template-ul in db.
        :return: Id-ul asignat template-ului.
        """

        try:

            template_in_db = {
                "name": template.title,
                "elements": jsonable_encoder(template.elements),
                "owner_id": owner_id,
                "status": status
            }

            result = self.templates_table.insert_one(template_in_db)

            return DBResult(201, "Created.", str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:
            return DBResult(409, "Template with this name already exists.")

    # modifica template-ul, inlocuind numele si intrebarile cu cele pasate
    def edit_template(self, template_id: str, new_template_data: NewTemplate) -> DBResult:

        new_template_in_db: dict = new_template_data.model_dump()

        result = self.templates_table.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": new_template_in_db}
        )

        if result.matched_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Updated.")


    # sterge template-ul
    def delete_template(self, template_id, user: User) -> DBResult:

        chk_auth: DBResult[Template] = self.check_template_authorization(template_id, user.id, user.is_admin, req='write')
        if chk_auth.status != 200:
            return DBResult(chk_auth.status, chk_auth.message)

        result = self.templates_table.delete_one({"_id": ObjectId(template_id)})

        if result.deleted_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Deleted.")

    @staticmethod
    def calculate_text_submission_data(answers: list[TextAnswer]) -> TextQuestionStatistic:

        word_count: int = 0
        words_counter: Counter = Counter()
        nr_answered: int = 0

        for answer in answers:
            words = re.split(r'[.;,\s]+', answer.text)
            word_count += len(words)
            if word_count != 0: nr_answered += 1
            words_counter.update(Counter(words))

        top_5_words = [item[0] for item in words_counter.most_common(5)]

        return TextQuestionStatistic(type=QuestionType.TEXT,
                                     engagement=nr_answered / len(answers) * 100,
                                     avg_word_count=word_count / nr_answered,
                                     frequent_words=top_5_words)

    @staticmethod
    def calculate_grid_submission_data(answers: list[MCAnswer],
                                       question: MCQuestion) -> MCQuestionStatistic:

        choices_counter: list[int] = [0 for _ in question.choices]
        nr_answered: int = 0

        for answer in answers:
            for choice in answer.choices:
                choices_counter[choice] += 1
            if answer.choices: nr_answered += 1

        answers_len = len(answers)
        return MCQuestionStatistic(type=QuestionType.MC,
                                   engagement=nr_answered / answers_len * 100,
                                   answer_rate=[cnt / nr_answered * 100 for cnt in choices_counter])

    @staticmethod
    def get_questions_answers(subs: list[Submission]) -> list[list[Answer]]:

        # initializam matricea de raspunsuri (ineficient dar pt moment merge)
        questions_answers: list[list[Answer]] = []
        for i in range(0, len(subs[0].answers)):
            answer_list = []
            questions_answers.append(answer_list)

        for submission in subs:  # parcurgem fiecare submisie
            for answer_index, answer in enumerate(submission.answers):  #
                questions_answers[answer_index].append(answer)

        return questions_answers

    def get_submission_data(self,
                            form_id,
                            owner_id: str,
                            form: Form | None = None) -> DBResult[
        list[QuestionStatisticUnion]]:

        try:

            if not form or (form and form.id != form_id):

                form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id), "owner_id": owner_id})

                if not form_from_db: return DBResult(404, "Form not found.")

                form = Form.model_validate(form_from_db)

            questions: list[QuestionUnion] = [e for e in form.elements if e.elem_type is ElemType.QUESTION] # extrage toate întrebările din formular
            submissions: list[Submission] | None = form.submissions

            if not submissions: return DBResult(200, "No submissions found.", [])

            questions_answers: list[list[Answer]] = self.get_questions_answers(submissions)

            statistics: list[TextQuestionStatistic | MCQuestionStatistic] = []

            for question_index, question in enumerate(questions):

                if isinstance(question, TextQuestion):

                    current_question_answers:list[TextAnswer] = [ans for ans in questions_answers[question_index] if
                                                                 isinstance(ans, TextAnswer)]
                    statistics.append(self.calculate_text_submission_data(current_question_answers))

                elif isinstance(question, MCQuestion):

                    current_question_answers: list[MCAnswer] = [ans for ans in questions_answers[question_index] if
                                                                isinstance(ans, MCAnswer)]
                    statistics.append(self.calculate_grid_submission_data(current_question_answers, question))


            return DBResult[list[QuestionStatisticUnion]](status=200, data=statistics)

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))



