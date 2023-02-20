from os import path, remove
from ..models.register import RegisterModel
import logging, json
import glob

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
        newRegister = {"total": 0, "configs": []}
        first_register_object = json.dumps(newRegister, indent=4)

        with open(self.full_path, "w") as r:
            r.write(first_register_object)
        return newRegister
    
    def _delete_register(self):
        remove(self.full_path)

    def get_or_create_register(self):
        '''
        Get or create register
        '''
        logger.info(self.store_directory)

        registerDataClass = RegisterModel(0, [])
        read_json = None

        # file path not exists -> create new file
        if not path.exists(self.full_path):
            self._create_register()
        
        # file exists but is empty -> create new clean file        
        if path.getsize(self.full_path) == 0:
            self._delete_register()
            read_json = self._create_register()

        # open file path
        
        with open(self.full_path, "r") as j:
            read_json = json.loads(j.read())
        
        # read info from json
        if not "total" in read_json or not "configs" in read_json:
            read_json = self._create_register()
            logger.warning("ERROR IN : register.json")
            logger.warning("CREATE NEW : register.json")
        
        registerDataClass.total = read_json["total"]
        registerDataClass.configs += read_json["configs"]
        
        return registerDataClass

    def update_json(self):
        register_file = open(self.full_path, "w")
        register_file.write(json.dumps(self.as_dict()))
        register_file.close()
        

    def add(self, config):
        self.register.configs += [config]
        self.register.total = len(self.register.configs)
        self.update_json()

    def read(self, id):
        return [config for config in self.register.configs if config.id == id]

    def update(self, config):
        self.delete(config)
        self.add(config)
        self.update_json()

    def delete(self, config):
        self.register.configs.remove(config)
        self.register.total = len(self.register.configs)
        self.update_json()
      
    def as_dict(self):
        return {
            "total": self.register.total,
            "configs": [config.as_dict() for config in self.register.configs]
        }
