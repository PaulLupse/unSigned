from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import DeleteResult

from typing import Tuple

from src.Backend.Utilities import hash_password, verify_password
from src.Backend.Domain.Models import Form, TextQuestion

from datetime import date, datetime

class Database:

    def __init__(self, url:str):
        try:
            database = MongoClient(url)["users"]
            self.users_table = database["users"]
            self.forms_table = database["forms"]
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

    def add_form(self, new_form:Form, owner:str)->int:

        if self.forms_table.find_one({"name":new_form.name, "owner":owner}):
            return 409

        current_date:date = datetime.now().date()
        new_form.dateCreated = current_date
        new_form.dateUpdated = current_date

        new_form_dict = new_form.model_dump(mode="json")
        new_form_dict["owner"] = owner

        self.forms_table.insert_one(new_form_dict)

        return 200

    def get_forms(self, owner:str)->list[Form]:

        form_list = list(self.forms_table.find({"owner":owner}, {"_id":0}))
        return form_list

    def delete_form(self, owner:str, name:str):

        delete_result:DeleteResult = self.forms_table.delete_one({"owner":owner,"name":name})
        if delete_result.deleted_count:
            return 200

        return 404

    def get_form(self, owner:str, name:str)->Tuple[Form, int]|int:

        form:Form = self.forms_table.find_one({"owner":owner,"name":name}, {"_id":0})

        if form:
            return form, 200

        return 404




