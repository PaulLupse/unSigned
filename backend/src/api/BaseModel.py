from typing import TypeVar, Generic, Any

from pydantic import BaseModel as BM, ConfigDict, RootModel as RM
from pydantic.alias_generators import to_camel
from pydantic.v1.utils import to_lower_camel


# Model pidantic de baza ce permite folosirea snake_case in modelele derivate, fara sa existe conflicte de denumire
# la transmiterea datelor in frontend (care lucreaza in camelCase)
class BaseModel(BM):

    model_config = ConfigDict(
        alias_generator=to_lower_camel,
        populate_by_name=True,
        from_attributes=True,
    )

T = TypeVar("T")

class RootModel(RM[T], Generic[T]):

    def __getattr__(self, item:str)->Any:

        if item in ("__dict__", "__pydantic_fields_set__", "root"):
            raise AttributeError(item)
        return getattr(self.root, item)

    def __setattr__(self, name:str, value:Any)->None:

        if name in ("root", "__dict__") or name.startswith("_"):
            super().__setattr__(name, value)
        else:
            setattr(self.root, name, value)

