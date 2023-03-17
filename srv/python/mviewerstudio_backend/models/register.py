from dataclasses import dataclass, replace, field
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
    configs: List[ConfigModel] = field(default_factory=[])
