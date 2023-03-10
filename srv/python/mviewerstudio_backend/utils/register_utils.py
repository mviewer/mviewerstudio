from os import path, remove, listdir
from os.path import isdir
from ..models.register import RegisterModel
import logging, json
from .config_utils import Config
import glob
from .login_utils import current_user
from .git_utils import init_or_get_repo, checkout

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
        '''
        Will read each files on server startup to create json and init register config data class
        in memory.
        '''
        self._delete_register()
        self._create_empty_register()
        self._configs_files_to_register()
        
    def _delete_register(self):
        '''
        Delete register JSON file
        '''
        remove(self.full_path)
    
    def from_xml_path(self, xml_path):
        config = None
        with open(xml_path) as f:
            xml_read = f.read()
            config = Config(
                "",
                current_user,
                self.app,
                xml_read
            )
        return config
    
    def _configs_files_to_register(self):
        '''
        Will parse all app configs workspace to init class config for each.
        '''
        dirs = [
            dir for dir in listdir(self.store_directory) if isdir(path.join(self.store_directory, dir)) and glob.glob("%s/*.xml" % path.join(self.store_directory, dir))
        ]
        
        for dir in dirs:
            app_path = path.join(self.store_directory, dir)
            for xml in glob.glob("%s/*.xml" % app_path):
                repo = init_or_get_repo(app_path)
                # to be sur each app is in master branch
                checkout(repo, "master", True)
                # will return config as class data
                config = self.from_xml_path(xml)
                if config :
                    self.update(config.as_dict())

    def update_register(self, json_dict=None):
        register_file = open(self.full_path, "w")
        if json_dict :
            register_file.write(json.dumps(json_dict))
        register_file.close()
        
    def read_json(self, id):
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        return [config for config in register_json["configs"] if config["id"] == id]

    def add(self, config_dict):
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        register_json["configs"].append(config_dict)
        register_json["total"] = len(register_json["configs"])
        self.update_register(register_json)

    def update_from_id(self, id):
        xml_path = glob.glob("%s/*.xml" % path.join(self.store_directory, id))
        if xml_path:
            config = self.from_xml_path(xml_path[0])
            config_dict = config.as_dict()
            self.update(config_dict)


    def update(self, config):
        self.delete(config["id"])
        self.add(config)

    def delete(self, id):
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        json_clean = [config for config in register_json["configs"] if config["id"] != id]
        self.update_register({"total": len(json_clean), "configs": json_clean})
      
    def as_dict(self):
        return {
            "total": self.register.total,
            "configs": [config.as_dict() for config in self.register.configs]
        }

    def search_configs(self, pattern):
        '''
        Search pattern inside configs fields (limited list).
        Parameters:
            pattern (str): string to search.
        '''       
        configs_match = []
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        for config in register_json["configs"]:
            fields_value = [config["title"], config["creator"], config["description"], config["keywords"], config["subject"], config["date"]]
            if [v for v in fields_value if v and pattern.lower() in v.lower()]:
                configs_match.append(config)
        return configs_match