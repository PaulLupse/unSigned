import re
from collections import Counter
from dataclasses import dataclass
from email import message

import pymongo.errors
from bson import ObjectId
from fastapi.encoders import jsonable_encoder
from pydantic import TypeAdapter, ValidationError

from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import DeleteResult, InsertOneResult

from src.backend.domain.models import AnswerStatistic, TextAnswer, TextQuestionAnswerStatistic, GridQuestionAnswerStatistic, \
    GridAnswer
from src.backend.domain.models import MinimalTemplateInfo, Template
from src.backend.domain.models import TextQuestion, GridQuestion
from src.backend.api.auth.auth import hash_password, verify_password
from src.backend.domain.models import Form, Submission, MinimalFormInfo, NewForm
from src.backend.domain.auth import Key

from datetime import date, datetime

import dotenv, os

dotenv.load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise ValueError("DATABASE_URL not set.")

mongo_client = MongoClient(DB_URL)

@dataclass
class DBResult[Type]:

    status:int
    message:str
    data:Type|None = None


class DBConnector:

    def __init__(self):
        try:
            database = mongo_client.get_database("db-chestionare")

            self.users_table = database["users"]
            self.forms_table = database["forms"]
            self.keys_table = database["keys"]
            self.templates_table = database["templates"]

        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout. Check server connection.")
            raise e

    # valideaza detaliile de logare
    # in caz de validitate, returneaza id-ul utilizatorului
    def validate_credentials(self, username:str, password:str)->DBResult[str]:

        user = self.users_table.find_one({"username": username})

        if user:

            password_in_db:str = user["password"]
            user_id:str = str(user['_id'])

            if verify_password(plain_password=password, hashed_password=password_in_db):
                return DBResult(200, "Valid credentials.", user_id)
            return DBResult(400, "Invalid credentials.")

        return DBResult(404, "User not found.")

    @staticmethod
    def validate_password(password:str)->DBResult:

        if len(password) > 30:
            return DBResult(400, "Password is too long.")
        elif len(password) < 8:
            return DBResult(400, "Password is too short.")
        return DBResult(200, "Password is valid.")

    def find_user(self, user_id:str)->DBResult:

        user = self.users_table.find_one({"_id":ObjectId(user_id)})

        if user: return DBResult(200, "User exists.")
        else: return DBResult(404, "User not found.")

    # metoda ce inregistreaza un utilizator
    # inregistreaza parola in baza de date sub forma 'hash'-uita, folosind un string generat aleator
    # returneaza id-ul utilizatorului
    def register_user(self, username:str, password:str)->DBResult[str]:

        try:

            validate_password = self.validate_password(password)
            if validate_password.status != 200: return validate_password

            hashed_password = hash_password(password)
            result:InsertOneResult = self.users_table.insert_one({"username":username,"password":hashed_password})

            return DBResult(201, "Created.", str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:

            return DBResult(409, "Username taken.")

    # sterge un utilizator pe baza username-ului
    def delete_user(self, user_id:str)->DBResult:

        result:DeleteResult = self.users_table.delete_one({"_id":ObjectId(user_id)})

        if result.deleted_count == 0: return DBResult(404, "User not found.")

        return DBResult(200, "Deleted.")

    # adauga un formular, returneaza id-ul
    def add_form(self, new_form:NewForm, owner_id:str)->DBResult[str]:

        try:

            if self.forms_table.find_one({"name":new_form.name, "owner_id":owner_id}):
                return DBResult(409, "Form with this name already exists.")

            current_date:date = datetime.now().date()

            new_form_dict = new_form.model_dump(mode="json")
            new_form_dict['dateCreated'] = current_date.isoformat()
            new_form_dict['submissions'] = []
            new_form_dict['owner_id'] = owner_id

            result:InsertOneResult = self.forms_table.insert_one(new_form_dict)

            return DBResult[str](201, "Created.", data=str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:
            return DBResult(409, "Form with this name already exists.")

    # seteaza proprietatea de publicare a unui formular la 'true'
    def publish_form(self, form_id:str)->DBResult:

        form_from_db = self.forms_table.find_one({"_id":ObjectId(form_id)})
        if not form_from_db: return DBResult(404, "Form not found.")


        print(form_from_db)
        if "datePublished" in form_from_db.keys(): return DBResult(409, "Form closed.")

        self.forms_table.update_one({"_id":ObjectId(form_id)}, update={"$set":{"datePublished":datetime.now().isoformat()}})
        return DBResult(200, "Published.")

    # 'inchide' un chestionar
    # un chestionar inchis nu mai accepta raspunsuri
    def close_form(self, form_id:str)->DBResult:

        form_from_db = self.forms_table.find_one({"_id": ObjectId(form_id)})
        if not form_from_db: return DBResult(404, "Form not found.")

        form_from_db['id'] = str(form_from_db.pop('_id'))
        form = Form.model_validate(form_from_db)

        print(form)

        if form.datePublished is None: DBResult(409, "Form not published.")

        self.forms_table.update_one({"_id": ObjectId(form_id)}, update={"$set": {"dateClosed": datetime.now().isoformat()}})
        return DBResult(200, "Closed.")

    # returneaza o lista de date minimale ale formularelor
    def get_forms(self, owner_id:str)->DBResult[list[MinimalFormInfo]]:

        # validam lista de formulare returnata de baza de date
        forms_from_db = list(self.forms_table.find({"owner_id":owner_id}))

        # necesar sa schimbam numele campului id
        for form in forms_from_db:
            form['id'] = str(form.pop('_id'))

        forms_from_db = TypeAdapter(list[Form]).validate_python(forms_from_db)

        minimal_forms:list[MinimalFormInfo] = TypeAdapter(list[MinimalFormInfo]).validate_python([MinimalFormInfo(name=form.name,
                                                               dateClosed=form.dateClosed,
                                                               dateCreated=form.dateCreated,
                                                               datePublished=form.datePublished,
                                                               submissionsCount=len(form.submissions),
                                                                id=form.id)
                                                                for form in forms_from_db])

        return DBResult(200, "Queried successfully.", minimal_forms)

    # sterge un chestionar pe baza id-ului
    def delete_form(self, form_id:str)->DBResult:

        delete_result:DeleteResult = self.forms_table.delete_one({'_id': ObjectId(form_id)})
        if delete_result.deleted_count:
            return DBResult(200, "Deleted.")

        return DBResult(404, "Form not found.")

    # returneaza un singur formular
    def get_form(self, form_id:str)->DBResult[Form]:

        form_from_db = self.forms_table.find_one(ObjectId(form_id))

        if form_from_db:
            form_from_db['id'] = str(form_from_db.pop('_id'))
            form:Form = Form.model_validate(form_from_db)

            return DBResult(200, "Queried successfully.", form)

        return DBResult(404, "Form not found.")

    # verifica daca cheia de access la un chestionar este folosita
    def check_key_usage(self, key:Key)->bool:

        if key.footer:
            found_key = self.keys_table.find_one({"_id":key.footer.keyId})
        else: raise ValueError("Key does not have a footer.")

        if found_key:
            return True
        return False

    # memoreaza id-ul cheii in baza de date
    def use_key(self, key:Key)->DBResult:

        if key.footer:
            self.keys_table.insert_one({"_id":key.footer.keyId})
        else: return DBResult(500, "Key does not have footer.")

        return DBResult(200, "Done.")

    # inregistreaza un raspuns pentru un formular
    def submit_form_answer(self, form_id:str, submission:Submission)->DBResult:

        self.forms_table.update_one({"_id": ObjectId(form_id)}, {"$push": {"submissions": submission.model_dump(mode="json")}})
        return DBResult(200, "Submitted.")

    # verifica daca formularul exista
    def check_form_existence(self, form_id:str)->bool:

        if self.forms_table.find_one({"_id":ObjectId(form_id)}):
            return True
        return False

    # modifica formularul prin atribuirea noilor intrebari sau a noului titlu
    # un formular nu poate fii modificat daca este deja publicat
    def edit_form(self,
                  form_id:str,
                  new_title:str|None = None,
                  new_questions:list[TextQuestion|GridQuestion]|None = None):

        try:

            new_data = {}
            new_data["questions"] = jsonable_encoder(new_questions)
            if new_title: new_data["name"] = new_title

            print(new_data)

            result = self.forms_table.update_one(
                {"_id":ObjectId(form_id)},
                {
                    "$set": new_data
                }
            )

            if result.modified_count == 0: return DBResult(404, "Form not found.")

            return DBResult(200, "Updated.")

        except Exception as e:

            return DBResult(500, "Unexpected error: " + str(e))

    # returneaza detalii minime despre template-urile utilizatorului
    def get_templates(self, owner_id:str)->DBResult[list[MinimalTemplateInfo]]:

        try:

            templates_from_db = self.templates_table.find({"ownerId":owner_id})

            template_list:list[MinimalTemplateInfo] = \
                [ MinimalTemplateInfo(
                        id=str(template['_id']),
                        name=template['name'],
                        questionCount=len(template['questions']),
                        ownerId=template['ownerId'])

                for template in templates_from_db]

            return DBResult[list[MinimalTemplateInfo]](status=200, message="Queried successfully.", data=template_list)

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    # returneaza un template dupa id
    def get_template(self, template_id:str)->DBResult[Template]:

        try:

            if not ObjectId.is_valid(template_id): return DBResult(404, "Template not found.")

            template_from_db = self.templates_table.find_one({"_id":ObjectId(template_id)})

            if template_from_db is None: return DBResult(404, "Template not found.")

            template_from_db["id"] = str(template_from_db.pop("_id"))

            template:Template = Template.model_validate(template_from_db)

            return DBResult(200, "Queried.", template)

        except ValidationError as e:
            return DBResult(500, "Database error: " + str(e))

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))

    # verifica existenta unui template
    def check_template_existence(self, template_id:str)->bool:

        if self.templates_table.find_one({"_id":template_id}):
            return True
        return False

    # memoreaza template-ul in baza de date
    def create_template(self, name:str, questions:list[TextQuestion|GridQuestion], owner_id:str)->DBResult[str]:

        try:

            template_in_db = {
                "name":name,
                "questions":jsonable_encoder(questions),
                "ownerId":owner_id
            }

            result = self.templates_table.insert_one(template_in_db)

            return DBResult(201, "Created.", str(result.inserted_id))

        except pymongo.errors.DuplicateKeyError:
            return DBResult(409, "Template with this name already exists.")

    # modifica template-ul, inlocuind numele si intrebarile cu cele pasate
    def edit_template(self, template_id:str|None, new_name:str|None, new_questions:list[TextQuestion|GridQuestion]|None)->DBResult:

        new_template_in_db:dict = {}

        if new_name: new_template_in_db['name'] = new_name
        new_template_in_db['questions'] = jsonable_encoder(new_questions)

        result = self.templates_table.update_one(
            {"_id":ObjectId(template_id)},
            { "$set":new_template_in_db }
        )

        if result.matched_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Updated.")

    # sterge template-ul
    def delete_template(self, template_id)->DBResult:

        result = self.templates_table.delete_one({'_id':ObjectId(template_id)})

        if result.deleted_count == 0: return DBResult(404, "Template not found.")

        return DBResult(200, "Deleted.")

    @staticmethod
    def calculate_text_submission_data(answers:list[TextAnswer], question:TextQuestion)->TextQuestionAnswerStatistic:

        word_count:int = 0
        words_counter:Counter = Counter()
        nr_answered:int = 0

        for answer in answers:
            words = re.split(r'[.;,\s]+', answer.text)
            word_count += len(words)
            if word_count != 0: nr_answered += 1
            words_counter.update(Counter(words))

        top_5_words = [item[0] for item in words_counter.most_common(5)]

        return TextQuestionAnswerStatistic(type='text',
                                           engagement=nr_answered / len(answers) * 100,
                                           avgWordCount= word_count / len(answers),
                                           frequentWords=top_5_words)

    @staticmethod
    def calculate_grid_submission_data(answers:list[GridAnswer], question:GridQuestion)->GridQuestionAnswerStatistic:

        choices_counter:list[int] = [0 for _ in question.choices]
        nr_answered:int = 0

        for answer in answers:
            for choice in answer.choices:
                choices_counter[choice] += 1
            if answer.choices: nr_answered += 1

        answers_len = len(answers)
        return GridQuestionAnswerStatistic(type='grid',
                                           engagement=nr_answered/answers_len*100,
                                           answerRate=[cnt/answers_len*100 for cnt in choices_counter])

    @staticmethod
    def get_questions_answers(subs:list[Submission])->list[list[TextAnswer]|list[GridAnswer]]:

        # initializam matricea de raspunsuri (ineficient dar pt moment merge)
        questions_answers:list[list[TextAnswer]|list[GridAnswer]] = []
        for i in range(0, len(subs[0].answers)):
            answer_list = []
            questions_answers.append(answer_list)

        for sub in subs:
            for answer_index, answer in enumerate(sub.answers):
                questions_answers[answer_index].append(answer)

        return questions_answers

    def get_submission_data(self, form_id)->DBResult[list[TextQuestionAnswerStatistic|GridQuestionAnswerStatistic]]:

        try:

            form_from_db = self.forms_table.find_one({"_id":ObjectId(form_id)})

            if not form_from_db: return DBResult(404, "Form not found.")

            form_from_db['id'] = str(form_from_db.pop('_id'))
            form = Form.model_validate(form_from_db)

            questions:list[TextQuestion|GridQuestion] = form.questions
            submissions:list[Submission]|None = form.submissions

            if not submissions: return DBResult(200, "No submissions found.", [])

            questions_answers:list[list[TextAnswer]|list[GridAnswer]] = self.get_questions_answers(submissions)

            statistics:list[TextQuestionAnswerStatistic|GridQuestionAnswerStatistic] = []

            for question_index, question in enumerate(questions):

                if type(question) == TextQuestion:
                    statistics.append(self.calculate_text_submission_data(questions_answers[question_index], question))

                elif type(question) == GridQuestion:
                    statistics.append(self.calculate_grid_submission_data(questions_answers[question_index], question))

            return DBResult[list[TextQuestionAnswerStatistic|GridQuestionAnswerStatistic]](status=200, data=statistics, message="Ok.")

        except Exception as e:
            return DBResult(500, "Unexpected error: " + str(e))


def get_db()->DBConnector:
    try:
        return DBConnector()
    except Exception as e:
        raise Exception("Unexpected error: " + str(e))

if __name__ == "__main__":

    db = get_db()
    print(db.get_submission_data('69f3f65a38b069bc7088df78'))



