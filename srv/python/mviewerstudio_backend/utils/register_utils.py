from os import path, remove, listdir
from os.path import isdir
from ..models.register import RegisterModel, ConfigModel
import logging, json
from .config_utils import Config
import glob
from .login_utils import current_user

logger = logging.getLogger(__name__)  

class ConfigRegister:
    def __init__(self, app) -> None:
        self.app = app
        self.store_directory = app.config["EXPORT_CONF_FOLDER"]
        self.name = "register.json"
        self.full_path = path.join(self.store_directory, self.name)
        self.register = self._create_empty_register()
        self.user = current_user

    def _create_empty_register(self):
        '''
        Create empty register json file and init register data class
        '''
        newRegister = {"total": 0, "configs": []}
        first_register_object = json.dumps(newRegister, indent=4)

        with open(self.full_path, "w") as r:
            r.write(first_register_object)
        registerDataClass = RegisterModel(0, [])

        return registerDataClass
    
    def create_register_from_file_system(self):
        self._delete_register()
        self._create_empty_register()
        self._configs_files_to_register()
        
    def _delete_register(self):
        remove(self.full_path)

    def _configs_files_to_register(self):
        dirs = [
            dir for dir in listdir(self.store_directory) if isdir(path.join(self.store_directory, dir)) and glob.glob("%s/*.xml" % path.join(self.store_directory, dir))
        ]
        
        for dir in dirs:
            for xml in glob.glob("%s/*.xml" % path.join(self.store_directory, dir)):
                with open(xml) as f:
                    xml_read = f.read()
                    config = Config(
                        "",
                        current_user,
                        self.app,
                        xml_read
                    ).as_data()
                    self.add(config)

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
        if not config:
            return
        oldConfig = [c for c in self.register.configs if c.id == config.id][0]
        self.register.configs.remove(oldConfig)
        self.register.total = len(self.register.configs)
        self.update_json()
      
    def as_dict(self):
        return {
            "total": self.register.total,
            "configs": [config.as_dict() for config in self.register.configs]
        }


