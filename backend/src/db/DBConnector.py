import re
from collections import Counter
from typing import Literal, Mapping, Any

import pymongo.errors
from bson import ObjectId, CodecOptions
from fastapi.encoders import jsonable_encoder
from pydantic import TypeAdapter, ValidationError

from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import DeleteResult, InsertOneResult

from src.common import logger, mongo_client
from src.config import REFRESH_TOKEN_LIFESPAN_DAYS
from src.db.DBResult import DBResult
from src.domain.models import TextAnswer, TextQuestionAnswerStatistic, GridQuestionAnswerStatistic, GridAnswer, Question
from src.domain.models import MinimalTemplate, Template
from src.domain.models import TextQuestion, GridQuestion
from src.api.auth.utils import hash_password, verify_password
from src.domain.models import Form, Submission, MinimalForm, NewForm
from src.domain.auth import Key, User, UserStats, RefreshToken

from datetime import date, datetime, timezone, timedelta


class DBConnector:

    def __init__(self):
        try:
            database = mongo_client.get_database("db-chestionare")

            opt = CodecOptions(tz_aware=True)

            self.users_table = database["users"]
            self.forms_table = database["forms"]
            self.keys_table = database["keys"]
            self.templates_table = database["templates"]
            self.sessions_table = database.get_collection("sessions", codec_options=opt)
            self.verification_codes_table = database.get_collection("verification_codes", codec_options=opt)

        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout. Check server connection.")
            raise e

    # Valideaza detaliile de logare si returneaza detaliile despre utilizator
    # Identificatorul poate fii un email sau un username
    def validate_credentials(self, password: str, identifier: str) -> DBResult[User]:

        # Cautam utilizatorul atat dupa email cat si dupa parola
        user: Mapping[str, Any] | None = self.users_table.find_one(
            {
                "$or":
                    [
                        {"username": identifier},
                        {"email": identifier}
                    ]
            })

        user: dict = dict(user)

        if user:

            password_in_db: str | None = user.get("password")

            if password_in_db is None:
                return DBResult(400, "No password set.")

            if verify_password(plain_password=password, hashed_password=password_in_db):
                user.pop("password")

                return DBResult[User](200,
                                      "Valid credentials.",
                                      User.model_validate(user))

            return DBResult(400, "Invalid credentials.")

        return DBResult(404, "User not found.")

    def store_refresh_token(self, user_id: str, refresh_token_hash: str) -> DBResult[str]:

        expiration_date = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_LIFESPAN_DAYS)

        res: InsertOneResult = self.sessions_table.insert_one(
            {"user_id": user_id,
             "hash": refresh_token_hash,
             "is_used": False,
             "expires_at": expiration_date}, )

        if not res.inserted_id:
            return DBResult(500, "Cannot store refresh token.")

        return DBResult(200, "Stored refresh token.")

    # Sterge toate refresh token-urile apartinand utilizatorului
    def end_user_session(self, user_id: str, ) -> DBResult[str]:

        self.sessions_table.delete_many({"user_id": user_id})

        return DBResult(200, "Done.")

    def invalidate_refresh_token(self, refresh_token_hash: str) -> DBResult[str]:

        result = self.sessions_table.update_one(filter={"hash": refresh_token_hash},
                                                update={"$set": {"is_used": True}}, upsert=False)

        if result.modified_count == 0: return DBResult(404, "Token not found.")
        return DBResult(200, "Invalidated token.")

    # Verifica refresh token-ul
    def check_refresh_token(self, refresh_token_hash: str) -> DBResult[User | None]:

        result_from_db = self.sessions_table.find_one({"hash": refresh_token_hash})
        if not result_from_db: return DBResult(404, "Token not found.")

        result = RefreshToken.model_validate(result_from_db)

        try:

            if result.is_used:
                return DBResult(401, "Token used.")

            if result.is_expired():
                return DBResult(401, "Token expired.")

            logger.warning(result)

            find_res = self.find_user(user_id=result.user_id)

            return find_res


        except ValidationError as e:

            return DBResult(401, "Token is invalid.")

    def find_user(self,
                  user_id: str | None = None,
                  email: str | None = None,
                  username: str | None = None,
                  provider_user_id: str | None = None,
                  provider: str | None = None) -> DBResult[User | None]:

        search_filter = {}
        if user_id: search_filter.update({"_id": ObjectId(user_id)})
        if email: search_filter.update({"email": email})
        if username: search_filter.update({"username": username})
        if provider and provider_user_id:
            print("DEBUG:    " + provider + "::" + provider_user_id)
            search_filter.update({
                "providers": {
                    "$elemMatch": {
                        "provider": provider,
                        "provider_user_id": provider_user_id
                    }
                }
            })

        user = self.users_table.find_one(search_filter)

        if user:

            return DBResult(200, "User exists.", data=User.model_validate(user))
        else:
            return DBResult(404, "User not found.", data=None)

    # Metoda ce inregistreaza un utilizator
    # inregistreaza parola in baza de date sub forma 'hash'-uita, folosind un string generat aleator
    # returneaza id-ul utilizatorului
    def register_user(self,
                      username: str,
                      password: str | None,
                      email: str,
                      provider: str | None = None,
                      provider_user_id: str | None = None) -> DBResult[str]:

        hashed_password = hash_password(password) if password else None
        new_user_data: dict = {"username": username,
                               "password": hashed_password,
                               "email": email,
                               "is_admin": False}

        if provider and provider_user_id:
            new_user_data.update(
                {
                    "providers": [
                        {
                            "provider": provider,
                            "provider_user_id": provider_user_id
                        }
                    ],
                }
            )

        try:

            result: InsertOneResult = self.users_table.insert_one(new_user_data)

            return DBResult(201, "Created.", str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:

            return DBResult(409, "Username taken.")

    # Memoreaza un cod de verificare a unui email.
    def store_verification_code(self, verification_code: str, email: str) -> DBResult[str]:

        exp_date = datetime.now(timezone.utc) + timedelta(minutes=5)

        # Daca exista deja un cod de verificare pentru un email, acesta este suprascris, impreuna cu data de expirare.
        self.verification_codes_table.update_one(
            update={
                "$set": {
                    "verification_code": verification_code,
                    "email": email,
                    "expires_at": exp_date
                },
            }, filter={"email": email}, upsert=True)

        return DBResult(200, "Verification code stored.")

    # Verifica existenta si validitatea unui cod de verificare. Returneaza id-ul codului (spre a fii sters).
    def check_verification_code(self, verification_code: str, email: str) -> DBResult[str | None]:

        check_result = self.verification_codes_table.find_one({"email": email})

        if check_result:

            if check_result["verification_code"] != verification_code:
                return DBResult(400, "Verification code invalid.")

            if check_result["expires_at"] < datetime.now(timezone.utc):
                return DBResult(400, "Verification code expired.")

            return DBResult(200, "Ok.", data=str(check_result["_id"]))

        # Daca email-ul nu detine un cod de verificare, il consideram invalid.
        return DBResult(404, "No verification code found.")

    # Sterge codul de verificare cu id-ul specificat
    def delete_verification_code(self, verification_code_id: str) -> DBResult[str]:

        delete_result = self.verification_codes_table.delete_one({"_id": ObjectId(verification_code_id)})

        if not delete_result.deleted_count:
            return DBResult(404, "Verification code not found.")

        return DBResult(200, "Deleted.")

    # Modifica numele de utilizator al unui utilizator
    def change_username(self, user_id: str, new_username: str) -> DBResult:

        result = self.users_table.update_one({"_id": ObjectId(user_id)}, update={"$set": {"username": new_username}})
        if result.modified_count == 0:
            return DBResult(404, "User not found.")

        return DBResult(200, "Ok")

    # Adauga un provider la un cont de utilizator
    def link_user_account(self, user_id: str, provider: str, provider_user_id) -> DBResult[str]:

        result = self.users_table.update_one(
            filter={"_id": ObjectId(user_id)},
            update={
                "$push": {
                    "providers": {
                        "provider": provider,
                        "provider_user_id": provider_user_id
                    }
                }
            }
        )

        if not result.modified_count: return DBResult(404, "User not found.")

        return DBResult(200, f"Linked user {user_id} to provider: {provider}")

    # sterge un utilizator pe baza username-ului
    def delete_user(self, user_id: str) -> DBResult:

        self.templates_table.delete_many({"owner_id": user_id})
        self.forms_table.delete_many({"owner_id": user_id})
        result: DeleteResult = self.users_table.delete_one({"_id": ObjectId(user_id)})

        logger.warning(result)

        if result.deleted_count == 0: return DBResult(404, "User not found.")

        return DBResult(200, "Deleted.")

    def get_user_stats(self, user_id: str) -> DBResult[UserStats]:

        form_count: int = self.forms_table.count_documents(filter={"owner_id": user_id})
        template_count: int = self.templates_table.count_documents(filter={"owner_id": user_id})

        return DBResult(200, "Ok", UserStats(form_count=form_count, template_count=template_count))

    # adauga un formular, returneaza id-ul
    def add_form(self, new_form: NewForm, owner_id: str) -> DBResult[str]:

        try:

            current_date: date = datetime.now().date()

            new_form_dict = new_form.model_dump(mode="json")
            new_form_dict['date_created'] = current_date.isoformat()
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

        print(form_from_db)
        if "date_published" in form_from_db.keys(): return DBResult(409, "Form closed.")

        self.forms_table.update_one({"_id": ObjectId(form_id)},
                                    update={"$set": {"date_published": datetime.now().isoformat()}})
        return DBResult(200, "Published.")

    # 'inchide' un chestionar.
    # Un chestionar inchis nu mai accepta raspunsuri.
    def close_form(self, form_id: str, owner_id: str) -> DBResult:

        form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id), "owner_id": owner_id})
        if not form_from_db: return DBResult(404, "Form not found.")

        form = Form.model_validate(form_from_db)

        print(form)

        if form.date_opened is None: DBResult(409, "Form not published.")

        self.forms_table.update_one({"_id": ObjectId(form_id)},
                                    update={"$set": {"date_closed": datetime.now().isoformat()}})
        return DBResult(200, "Closed.")

    # returneaza o lista de date minimale ale formularelor
    def get_forms(self, owner_id: str) -> DBResult[list[MinimalForm]]:

        # validam lista de formulare returnata de baza de date
        forms_from_db = list(self.forms_table.find({"owner_id": owner_id}))

        forms = TypeAdapter(list[Form]).validate_python(forms_from_db)

        minimal_forms: list[MinimalForm] = TypeAdapter(list[MinimalForm]).validate_python(
            [form.to_minimal() for form in forms])

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
                  new_title: str | None = None,
                  new_questions: list[Question] | None = None):

        try:

            new_data = {"questions": jsonable_encoder(new_questions)}
            if new_title: new_data["name"] = new_title

            print(new_data)

            result = self.forms_table.update_one(
                {"_id": ObjectId(form_id), "owner_id": owner_id},
                {
                    "$set": new_data
                }
            )

            if result.modified_count == 0: return DBResult(404, "Form not found.")

            return DBResult(200, "Updated.")

        except Exception as e:

            return DBResult(500, "Unexpected error: " + str(e))

    # Returneaza template-urile utilizatorului sub format minimal
    def get_templates(self,
                      owner_id: str,
                      status: Literal['public', 'private', 'official']) -> DBResult[
        list[MinimalTemplate]]:

        try:

            if status == 'private':
                templates_from_db = self.templates_table.find({"owner_id": owner_id, 'status': 'private'})
            elif status == 'official':
                templates_from_db = self.templates_table.find({"status": 'official'})
            else:
                templates_from_db = self.templates_table.find({'status': 'public'})

            # Creeaza o lista de Modele MinimalTemplateInfo, luandu-si datele din templates_from_db
            template_list: list[MinimalTemplate] = \
                [MinimalTemplate(
                    id=template['_id'],
                    name=template['name'],
                    question_count=len(template['questions']),
                    owner_id=template['owner_id'])

                    for template in templates_from_db]

            return DBResult[list[MinimalTemplate]](status=200, message="Queried successfully.", data=template_list)

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    def check_authorization(self,
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

    # memoreaza template-ul in baza de date
    def create_template(self,
                        name: str,
                        questions: list[Question],
                        owner_id: str,
                        status: Literal['public', 'private', 'official']) -> DBResult[str]:

        try:

            template_in_db = {
                "name": name,
                "questions": jsonable_encoder(questions),
                "owner_id": owner_id,
                "status": status
            }

            result = self.templates_table.insert_one(template_in_db)

            return DBResult(201, "Created.", str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:
            return DBResult(409, "Template with this name already exists.")

    # modifica template-ul, inlocuind numele si intrebarile cu cele pasate
    def edit_template(self, template_id: str, user: User, new_name: str | None,
                      new_questions: list[Question] | None) -> DBResult:

        chk_auth: DBResult[Template] = self.check_authorization(template_id, user.id, user.is_admin, req='write')

        if chk_auth.status != 200:
            return DBResult(chk_auth.status, chk_auth.message)

        new_template_in_db: dict = {}

        if new_name: new_template_in_db['name'] = new_name
        new_template_in_db['questions'] = jsonable_encoder(new_questions)

        result = self.templates_table.update_one(
            {"_id": ObjectId(template_id)},
            {"$set": new_template_in_db}
        )

        if result.matched_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Updated.")

    # sterge template-ul
    def delete_template(self, template_id, user: User) -> DBResult:

        chk_auth: DBResult[Template] = self.check_authorization(template_id, user.id, user.is_admin, req='write')
        if chk_auth.status != 200:
            return DBResult(chk_auth.status, chk_auth.message)

        result = self.templates_table.delete_one({"_id": ObjectId(template_id)})

        if result.deleted_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Deleted.")

    @staticmethod
    def calculate_text_submission_data(answers: list[TextAnswer]) -> TextQuestionAnswerStatistic:

        word_count: int = 0
        words_counter: Counter = Counter()
        nr_answered: int = 0

        for answer in answers:
            words = re.split(r'[.;,\s]+', answer.text)
            word_count += len(words)
            if word_count != 0: nr_answered += 1
            words_counter.update(Counter(words))

        top_5_words = [item[0] for item in words_counter.most_common(5)]

        return TextQuestionAnswerStatistic(type='text',
                                           engagement=nr_answered / len(answers) * 100,
                                           avg_word_count=word_count / nr_answered,
                                           frequent_words=top_5_words)

    @staticmethod
    def calculate_grid_submission_data(answers: list[GridAnswer],
                                       question: GridQuestion) -> GridQuestionAnswerStatistic:

        choices_counter: list[int] = [0 for _ in question.choices]
        nr_answered: int = 0

        for answer in answers:
            for choice in answer.choices:
                choices_counter[choice] += 1
            if answer.choices: nr_answered += 1

        answers_len = len(answers)
        return GridQuestionAnswerStatistic(type='grid',
                                           engagement=nr_answered / answers_len * 100,
                                           answer_rate=[cnt / nr_answered * 100 for cnt in choices_counter])

    @staticmethod
    def get_questions_answers(subs: list[Submission]) -> list[list[TextAnswer] | list[GridAnswer]]:

        # initializam matricea de raspunsuri (ineficient dar pt moment merge)
        questions_answers: list[list[TextAnswer] | list[GridAnswer]] = []
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
        list[TextQuestionAnswerStatistic | GridQuestionAnswerStatistic]]:

        try:

            if not form or (form and form.id != form_id):

                form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id), "owner_id": owner_id})

                if not form_from_db: return DBResult(404, "Form not found.")

                form = Form.model_validate(form_from_db)

            questions: list[Question] = form.questions
            submissions: list[Submission] | None = form.submissions

            if not submissions: return DBResult(200, "No submissions found.", [])

            questions_answers: list[list[TextAnswer] | list[GridAnswer]] = self.get_questions_answers(submissions)

            statistics: list[TextQuestionAnswerStatistic | GridQuestionAnswerStatistic] = []

            for question_index, question in enumerate(questions):

                if type(question) == TextQuestion:
                    statistics.append(self.calculate_text_submission_data(questions_answers[question_index]))

                elif type(question) == GridQuestion:

                    if question.question_type == 'grid':
                        statistics.append(
                            self.calculate_grid_submission_data(questions_answers[question_index], question))

                    else:
                        raise ValueError("Question type not matching: " + question)

            return DBResult[list[TextQuestionAnswerStatistic | GridQuestionAnswerStatistic]](status=200,
                                                                                             data=statistics,
                                                                                             message="Ok.")

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))


def get_db() -> DBConnector:
    try:
        return DBConnector()
    except Exception as e:
        raise Exception("Unexpected error: " + str(e))
