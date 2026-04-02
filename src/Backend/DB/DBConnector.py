from bson import ObjectId
from pydantic import TypeAdapter

from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import DeleteResult

from typing import Tuple

from src.Backend.Utilities import hash_password, verify_password
from src.Backend.Domain.General import Form, Submission, MinimalFormInfo, NewForm
from src.Backend.Domain.Credentials import Key

from datetime import date, datetime

class Database:

    def __init__(self, url:str):
        try:
            db = MongoClient(url)["users"]
            self.users_table = db["users"]
            self.forms_table = db["forms"]
            self.keys_table = db["keys"]
        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout. Check server connection.")
            raise e

    def validate_credentials(self, username:str, password:str):

        user = self.users_table.find_one({"username":username})

        if user:

            password_in_db:str = user["password"]
            salt:str = user["salt"]

            if verify_password(plain_password=password, hashed_password=password_in_db, salt=salt):
                return 200
            return 400

        return 404

    def find_user(self, username:str):

        user = self.users_table.find_one({"username":username}, {"username":1})

        if user:
            return 200
        else: return 404

    # metoda ce inregistreaza un utilizator
    # inregistreaza parola in baza de date sub forma 'hash'-uita, folosind un string generat aleator
    def register_user(self, username:str, password:str):

        user = self.users_table.find_one({"username":username})

        if user:
            return 409

        hashed_password, salt = hash_password(password)
        self.users_table.insert_one({"username":username,"password":hashed_password, "salt":salt})

        return 201

    def delete_user(self, username:str):

        user = self.users_table.find_one({"username":username})

        if not user:
            return 404

        self.users_table.delete_one({"username":username})

        return 200

    def add_form(self, new_form:NewForm, owner:str)->int:

        if self.forms_table.find_one({"name":new_form.name, "owner":owner}):
            return 409

        current_date:date = datetime.now().date()

        new_form_dict = new_form.model_dump(mode="json")
        new_form_dict['dateCreated'] = current_date.isoformat()
        new_form_dict['submissions'] = []
        new_form_dict['owner'] = owner

        self.forms_table.insert_one(new_form_dict)

        return 200

    # returneaza o lista de date minimale ale formularelor
    def get_forms(self, owner:str)->list[MinimalFormInfo]:

        # validam lista de formulare returnata de baza de date
        forms_from_db = list(self.forms_table.find({"owner":owner}))

        # necesar sa schimbam numele campului id
        for form in forms_from_db:
            form['id'] = str(form.pop('_id'))

        forms_from_db = TypeAdapter(list[Form]).validate_python(forms_from_db)

        minimal_forms:list[MinimalFormInfo] = TypeAdapter(list[MinimalFormInfo]).validate_python([MinimalFormInfo(name=form.name,
                                                               dateClosed=None,
                                                               dateCreated=form.dateCreated,
                                                               datePublished=None,
                                                               submissionsCount=len(form.submissions),
                                                                id=form.id)
                                                                for form in forms_from_db])

        return minimal_forms

    def delete_form(self, form_id:str)->int:

        delete_result:DeleteResult = self.forms_table.delete_one({'_id': ObjectId(form_id)})
        if delete_result.deleted_count:
            return 200

        return 404

    def get_form(self, form_id:str)->Tuple[Form|None, int]:

        form_from_db = self.forms_table.find_one(ObjectId(form_id))

        if form_from_db:
            form_from_db['id'] = str(form_from_db.pop('_id'))
            form:Form = Form.model_validate(form_from_db) if form_from_db else None

            if form.dateClosed is not None and form.dateClosed < datetime.now():
                return form, 423

            return form, 200

        return None, 404

    def check_key_usage(self, key:Key)->bool:
        found_key = self.keys_table.find_one({"keyId":key.keyId})

        if found_key:
            return True
        return False

    def submit_form_answer(self, key:Key, submission:Submission)->int:

        try :
            self.forms_table.update_one({"_id": ObjectId(key.formId)}, {"$push": {"submissions": submission.model_dump(mode="json")}})
            return 200
        except:
            return 500

    def check_form_existence(self, form_id:str)->int:

        if self.forms_table.find_one({"_id":ObjectId(form_id)}):
            return 200
        return 404

if __name__ == '__main__':
    db = Database("mongodb://localhost:27017/")


