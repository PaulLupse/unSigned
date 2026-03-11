from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError

from src.Backend.Utilities import hash_password, verify_password
from src.Backend.Domain.Models import Item

class Database:

    def __init__(self, url:str):
        try:
            database = MongoClient(url)["users"]
            self.users_table = database["users"]
            self.items_table = database["items"]
        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout")
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

    def add_item(self, item:Item)->int:

        if item.name == '' or item.value == '':
            return 400

        if self.items_table.find_one({"name":item.name}):
            return 409

        dict_item:dict = item.model_dump(mode="json")

        self.items_table.insert_one(dict_item)

        return 200

    def get_items(self, owner:str)->list[Item]:

        item_list = list(self.items_table.find({"owner":owner}, {"name":1, "value":1, "_id":0}))
        return item_list


if __name__=="__main__":

    print(Database("mongodb://localhost:27017/").get_items(owner="a"))