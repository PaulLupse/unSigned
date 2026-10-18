from datetime import timedelta, timezone, datetime
from typing import Mapping, Any

import pymongo
from bson import CodecOptions, ObjectId
from pydantic import ValidationError
from pymongo.errors import ServerSelectionTimeoutError
from pymongo.results import InsertOneResult, DeleteResult

from src.api.auth.utils import verify_password, hash_password
from src.common import mongo_client, logger
from src.config import REFRESH_TOKEN_LIFESPAN_DAYS
from src.db.DBResult import DBResult
from src.domain.auth import User, RefreshToken


class AuthDBConnector:

    def __init__(self):
        try:
            database = mongo_client.get_database("db-chestionare")

            opt = CodecOptions(tz_aware=True)

            self.users_table = database["users"]
            self.sessions_table = database.get_collection("sessions", codec_options=opt)
            self.verification_codes_table = database.get_collection("verification_codes", codec_options=opt)

        except ServerSelectionTimeoutError as e:
            print("ERROR: Server Selection Timeout. Check backend-connection connection.")
            raise e

    @staticmethod
    def get_db():
        try:
            return AuthDBConnector()
        except Exception as e:
            raise Exception("Unexpected error: " + str(e))

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

    def register_user(self,
                      username: str,
                      password: str | None,
                      email: str,
                      provider: str | None = None,
                      provider_user_id: str | None = None) -> DBResult[str]:

        """
        Inregistreaza un utilizator
        :return: ID-ul utilizatorulu înregistrat.
        """

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

        result = self.users_table.update_one({"_id": ObjectId(user_id)},
                                             update={"$set": {"username": new_username}})
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

        result: DeleteResult = self.users_table.delete_one({"_id": ObjectId(user_id)})

        logger.warning(result)

        if result.deleted_count == 0: return DBResult(404, "User not found.")

        return DBResult(200, "Deleted.")