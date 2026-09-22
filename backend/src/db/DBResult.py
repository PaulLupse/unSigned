from dataclasses import dataclass


@dataclass
class DBResult[Type]:
    status: int
    message: str | None = None
    data: Type | None = None

    def ok(self):
        return 200 <= self.status <= 299
