from dataclasses import dataclass, replace, field
from .config import ConfigModel
from typing import List
import logging

logger = logging.getLogger(__name__)

<<<<<<< HEAD
<<<<<<< HEAD
=======

@dataclass
class ConfigModel:
    """
    Config schema dataclass
    To manipulate config data
    """

    id: int
    titre: str
    versions: List[str]
    keywords: List[str]

    def as_dict(self):
        return {
            "id": self.id,
            "titre": self.titre,
            "versions": self.versions,
            "keywords": self.keywords,
        }


>>>>>>> 62cfd1c (init new register system and add gitpython)
=======

>>>>>>> 28c833c (format python files with black)
@dataclass
class RegisterModel:
    """
    Register schema dataclass
    To manipulate config versions data
    """

    total: int
    configs: List[ConfigModel] = field(default_factory=[])
