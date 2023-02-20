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
    creator: str
    versions: List[str]
    keywords: List[str]
    url: int
    subject: str
    date: str

    def as_dict(self):
        return {
            "id": self.id,
            "titre": self.titre,
            "creator": self.creator,
            "versions": self.versions,
            "keywords": self.keywords,
            "url": self.url,
            "subject": self.subject,
            "date": self.date
        }
