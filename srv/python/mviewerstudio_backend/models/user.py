from dataclasses import dataclass
from typing import List, Optional
from ..enhancers.json import dataclass_to_json

@dataclass
class User:
    username: str
    firstname: str
    lastname: str
    organisation: Optional[str]
    roles: List[str]

    def as_dict(self):
        return {
            "user_name": self.username,
            "first_name": self.firstname,
            "last_name": self.lastname,
            "organisation": {"legal_name": self.organisation},
            "roles": self.roles,
        }