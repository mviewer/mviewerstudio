from dataclasses import dataclass
from .config import ConfigModel
from typing import List
import logging

logger = logging.getLogger(__name__)

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
