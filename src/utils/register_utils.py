from os import path, remove, listdir
from os.path import isdir
from shutil import rmtree
from ..models.register import RegisterModel
import logging, json
from .config_utils import Config
import glob
from .login_utils import current_user
from .git_utils import init_or_get_repo, checkout

logger = logging.getLogger(__name__)

"""
This class ease config manipulations as creation, read, write from XML.
This class is usefull to convert XML or XML's directory to register JSON file (and vice versa).
"""


def from_xml_path(app, xml_path):
    """
    This func allow to create Config class data from XML path directory.
    :param xml_path: string absolute xml path
    """
    config = None
    with open(xml_path) as f:
        xml_read = f.read()
        config = Config("", app, xml_read, xml_path)
    return config


class ConfigRegister:
    def __init__(self, app) -> None:
        """
        :param app: application context as object
        """
        self.app = app
        self.store_directory = app.config["EXPORT_CONF_FOLDER"]
        self.name = "register.json"
        self.full_path = path.join(self.store_directory, self.name)
        self.register = self._create_empty_register()

    def _create_empty_register(self):
        """
        Create empty register json file and init register data class
        """
        newRegister = {"total": 0, "configs": []}
        first_register_object = json.dumps(newRegister, indent=4)

        with open(self.full_path, "w") as r:
            r.write(first_register_object)
        registerDataClass = RegisterModel(0, [])

        return registerDataClass

    def create_register_from_file_system(self):
        """
        Will read each files on server startup to create json and init register config data class
        in memory.
        """
        try:
            logger.info("REGISTER : CREATE PROCESS START")
            self._delete_register()
            self._create_empty_register()
            self._configs_files_to_register()
            logger.info("REGISTER : CREATE PROCESS SUCCESS")
        except:
            logger.error(
                "REGISTER : CREATE PROCESS FAIL - Please control each app files"
            )

    def _delete_register(self):
        """
        Delete register JSON file
        """
        remove(self.full_path)

    def _configs_files_to_register(self):
        """
        Will parse all app configs workspace to init class config for each.
        """
        sub_store_dirs = [
            path.join(self.store_directory, dir)
            for dir in listdir(self.store_directory)
            if isdir(path.join(self.store_directory, dir)) and dir not in ["styles"]
        ]
        # and glob.glob("%s/*.xml" % path.join(self.store_directory, dir))
        xml_dirs = []
        logger.debug("TRY TO CREATE REGISTER FILE")
        for sub_dir in sub_store_dirs:
            app_dirs = [
                path.join(sub_dir, dir)
                for dir in listdir(sub_dir)
                if isdir(path.join(sub_dir, dir))
                and glob.glob("%s/*.xml" % path.join(sub_dir, dir))
            ]
            xml_dirs = [*xml_dirs, *app_dirs]
            logger.debug("CREATE REGISTER FILE : SUCCESS")

        for app_path in xml_dirs:
            logger.info(f"REGISTER : PROCESS {app_path}")
            try:
                repo = init_or_get_repo(app_path)
                # to be sur each app is in master branch
                checkout(repo, "master", True)

                xml = self._keep_one_xml_file(app_path)
                if xml:
                    config = from_xml_path(self.app, xml)
                    if config:
                        self._keep_one_xml_file(app_path, config.full_xml_path)
                        self.update(config.as_dict())
                        logger.debug(f"UPDATE TO REGISTER : SUCCESS")
                logger.info(f"REGISTER : APP PROCESS SUCCESS {app_path}")
            except Exception as e:
                logger.error(f"REGISTER : FAIL TO PROCESS {app_path}")
                logger.error(e)
            logger.debug(f"REGISTER : APP PROCESS END")

    def _keep_one_xml_file(self, app_path, xml_to_keep=None):
        """
        Keep one XML file in an app workspace and remove duplicate XML files.
        """
        xml_files = glob.glob("%s/*.xml" % app_path)
        if not xml_files:
            return None

        if xml_to_keep and xml_to_keep in xml_files:
            keep = xml_to_keep
        elif len(xml_files) == 1:
            return xml_files[0]
        else:
            xml_files.sort()
            expected_xml = path.join(app_path, "%s.xml" % path.basename(app_path))
            xml_with_dir = [xml for xml in xml_files if isdir(path.splitext(xml)[0])]
            if expected_xml in xml_files:
                keep = expected_xml
            else:
                keep = xml_with_dir[0] if xml_with_dir else xml_files[0]

        for xml in xml_files:
            if xml != keep:
                remove(xml)
                xml_dir = path.splitext(xml)[0]
                if isdir(xml_dir):
                    rmtree(xml_dir)
                logger.warning(f"REGISTER : REMOVE DUPLICATE XML {xml}")
        return keep

    def update_register(self, json_dict=None):
        """
        Replace register json file by a given json content.
        :param json_dict: dict to insert as new json content.
        """
        logger.debug(f"REGISTER : UPDATE - WRITE FILE SYSTEM")
        try:
            register_file = open(self.full_path, "w")
            if json_dict:
                register_file.write(json.dumps(json_dict))
            register_file.close()
        except:
            logger.error(f"REGISTER : FAIL TO WRITE FILE SYSTEM")

    def read_json(self, id):
        """
        Return config from json register file by ID.
        :param id: string uuid use as unique directory name
        """
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        return [config for config in register_json["configs"] if config["id"] == id]

    def add(self, config_dict):
        """
        Insert a config to json register file.
        :param config_dict: config class data as dict
        """
        logger.debug(f"REGISTER : ADD CONFIG {id}")
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        register_json["configs"].append(config_dict)
        register_json["total"] = len(register_json["configs"])
        self.update_register(register_json)

    def update_from_id(self, id):
        """
        Read UUID app directory from file system, get XML and
        update json register file with XML.
        This allow to change XML manually and update register automatically on service startup.
        :param id: string uuid use as unique directory name
        """
        logger.debug(f"REGISTER : UPDATE CONFIG FROM ID {id}")
        xml_path = glob.glob(
            "%s/*.xml"
            % path.join(self.store_directory, current_user.normalize_name, id)
        )
        if xml_path:
            app_path = path.join(self.store_directory, current_user.normalize_name, id)
            config = from_xml_path(self.app, self._keep_one_xml_file(app_path))
            config_dict = config.as_dict()
            self.update(config_dict)

    def update(self, config_dict):
        """
        Update register json file from config dict.
        :param config_dict: config class data as dict
        """
        config_id = config_dict["id"]
        logger.debug(f"REGISTER : UPDATE CONFIG {config_id}")
        self.delete(config_id)
        self.add(config_dict)

    def delete(self, id):
        """
        Delete a config to json register file.
        :param id: string uuid use as unique directory name
        """
        logger.debug(f"REGISTER : DELETE CONFIG {id}")

        register_file = open(self.full_path)
        register_json = json.load(register_file)
        json_clean = [
            config for config in register_json["configs"] if config["id"] != id
        ]
        self.update_register({"total": len(json_clean), "configs": json_clean})

    def as_dict(self):
        """
        Register
        """
        return {
            "total": self.register.total,
            "configs": [config.as_dict() for config in self.register.configs],
        }

    def search_configs(self, pattern):
        """
        Search pattern inside configs fields (limited list).
        :param pattern: string to search.
        """
        logger.debug(f"REGISTER : SEARCH CONFIGS")
        configs_match = []
        register_file = open(self.full_path)
        register_json = json.load(register_file)
        for config in register_json["configs"]:
            fields_value = [
                config["title"],
                config["creator"],
                config["description"],
                config["keywords"],
                config["subject"],
                config["date"],
            ]
            if [v for v in fields_value if v and pattern.lower() in v.lower()]:
                configs_match.append(config)
        return configs_match
