from dataclasses import dataclass
from typing import List
import logging

logger = logging.getLogger(__name__)


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


@dataclass
class RegisterModel:
    """
    Register schema dataclass
    To manipulate config versions data
    """

    total: int
    configs: List[ConfigModel]

    def as_dict(self):
        return {"total": self.total, "configs": self.configs}
