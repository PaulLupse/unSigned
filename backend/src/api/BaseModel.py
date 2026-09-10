from pydantic import BaseModel as BM, ConfigDict
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

