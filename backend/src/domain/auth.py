from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel

from src.api.BaseModel import BaseModel
from src.utilities import PyObjectId, PyObjectIdField


class User(BaseModel):
    id: PyObjectId = PyObjectIdField  # Aliasul este necesar deoarece folosim id-ul documentelor din mongodb
    username: str
    is_admin: bool
    email: str


class UserStats(BaseModel):
    form_count: int
    template_count: int


class UserProfileWithStats(BaseModel):
    user: User
    stats: UserStats


class KeyPayload(BaseModel):
    """
    Datele retinute de o cheie de access.
    Attributes:
        form_id: ID-ul formularului
    """

    form_id: str


class KeyFooter(BaseModel):
    """
    Date generale despre o cheie de access.
    Attributes:
        key_id: ID-ul cheii, folosit la înregistrarea folosirii acesteia.
    """

    key_id: Optional[str] = None


class Key(BaseModel):
    """
    Reprezentare sub formă de model pydantic al unei chei de acces la un formular.
    Attributes:
        payload: Datele reținute de cheie
        footer: Date generale atașate cheii
    """

    payload: KeyPayload
    footer: KeyFooter = KeyFooter()


class VerificationCode(BaseModel):
    id: PyObjectId = PyObjectIdField
    code: str
    expires_at: datetime


class RefreshToken(BaseModel):
    user_id: str
    hash: str
    is_used: bool
    expires_at: datetime  # numarul de zile pt care va fii valabil

    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at
