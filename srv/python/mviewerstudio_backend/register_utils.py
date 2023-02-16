import hashlib
from os import path, mkdir
from .models.register import RegisterModel, ConfigModel
import logging, json, hashlib
import git

logger = logging.getLogger(__name__)  

class ConfigRegister:
    def __init__(self, store_directory) -> None:
        self.store_directory = store_directory
        self.name = "register.json"
        self.full_path = path.join(store_directory, self.name)
        self.register = self.get_or_create_register()

    def _create_register(self):
        '''
        Create json to follow meta for each last config version
        '''
        newRegister = RegisterModel(0, [])
        newRegister = {"total": 0, "configs": []}
        first_register_object = json.dumps(newRegister, indent=4)

        with open(self.full_path, "w") as r:
            r.write(first_register_object)

        return newRegister

    def get_or_create_register(self):
        '''
        Get or create register
        '''
        logger.info(self.store_directory)

        if not path.exists(self.full_path):
            return self._create_register()

        read_json = None
        json_file_path = self.full_path
        with open(json_file_path, "r") as j:
            read_json = json.loads(j.read())

        return RegisterModel(read_json["total"], read_json["configs"])
