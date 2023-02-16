import hashlib
from os import path, mkdir
from dataclasses import dataclass
from .models.register import RegisterModel, ConfigModel
from typing import List
import logging, uuid, json, hashlib

import git


logger = logging.getLogger(__name__)


class Config:
    def __init__(self, data, user, directory) -> None:
        self.user = user
        self.data = data.decode("utf-8")
        self.xml = self.data.replace("anonymous", user.username)
        self.directory = directory

        # init or create workspace
        self.workspace = self.init_workspace(directory)
        # init repo
        self.repo = git.Repo(self.workspace)

    def init_workspace(self):
        workspace_uuid = str(uuid.uuid4().int)[:10]
        workspace_path = path.join(self.directory, workspace_uuid)
        if not path.exists(self.workspace_path):
            # create directory
            mkdir(workspace_path)
            # init git
            git.Repo.init(workspace_path)
        return workspace_path

    def save_config(self, directory):
        file_path = path.join(directory, self.file_name)
        with open(file_path, "w") as file:
            file.write(self.xml)


class ConfigRegister:
    def __init__(self, store_directory) -> None:
        self.store_directory = store_directory
        self.name = "register.json"
        self.full_path = path.join(store_directory, self.name)

    def _create_register(self):
        newRegister = RegisterModel(0, [])
        newRegister = {"total": 0, "configs": []}
        first_register_object = json.dumps(newRegister, indent=4)

        with open(self.full_path, "w") as r:
            r.write(first_register_object)

        return newRegister

    def get_register(self):
        logger.info(self.store_directory)
        register_path = self.full_path

        if not path.exists(register_path):
            return self._create_register()

        read_json = None
        json_file_path = self.full_path
        with open(json_file_path, "r") as j:
            read_json = json.loads(j.read())

        print(read_json)

        return RegisterModel(read_json["total"], read_json["configs"])

    def create_file_name(self, xml_file):
        filehash = hashlib.md5()
        filehash.update(xml_file.encode("utf-8"))
        return f"{filehash.hexdigest()}.xml"
