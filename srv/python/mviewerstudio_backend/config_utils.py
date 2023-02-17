from os import path, mkdir, remove
import logging
import git
import xml.etree.ElementTree as ET
import xmltodict
logger = logging.getLogger(__name__)  
import re
import glob

from .models.config import ConfigModel

'''
This class ease CRUD + versioning configs operations.
A register given by app.register is use as global configs metadata store.
DCAT-RDF Metadata are given by front end (see .models.ConfigModel).
'''
class Config:
    def __init__(self, data, user, directory, register) -> None:
        self.user = user
        self._read_xml_data(data)
        self.register = register
        self.directory = directory

        # init or create workspace
        self.workspace = self.get_or_init_workspace()
        # init repo
        self.repo = git.Repo(self.workspace)
        # save xml and git commit
        self.create_config()
    
    def _read_xml_data(self, data):
        '''
        Decode request data body to XML.
        Then, will replace user info if exists.
        '''
        # read xml
        self.data = data.decode("utf-8")
        self.xml = self.data.replace("anonymous", self.user.username)
        # read metadata
        self.meta = self._get_xml_describe()
        if self.meta["dc:identifier"]:
            self.uuid = self.meta["dc:identifier"]

    def get_or_init_workspace(self):
        '''
        Init or retrieve workspace
        '''
        workspace_path = path.join(self.directory, self.uuid)

        if not path.exists(workspace_path):
            # create directory
            mkdir(workspace_path)
            # init git
            self.repo = git.Repo.init(workspace_path)
        return workspace_path
    
    def _get_xml_describe(self, node = None):
        '''
        Return metadata from xml DCAT balises
        '''
        xml_as_dict = xmltodict.parse(self.xml)
        meta_describe = xml_as_dict["config"]["metadata"]["rdf:RDF"]["rdf:Description"]
        if not node:
            return meta_describe
        else:
            return meta_describe["config"]["metadata"]["rdf:RDF"]["rdf:Description"][node]
    
    def _commit_changes(self, msg):
        '''
        Commit changes if needed.
        '''
        # commit file
        unstaged = [x for x in self.repo.index.diff(None)]
        if unstaged :
            self.repo.git.add('*')
            self.repo.git.commit(m=msg)
    
    def create_config(self):
        '''
        Create config workspace and save XML as file.
        Will init git file as version manager.
        '''
        # get meta info from XML
        if self.meta["dc:identifier"]:
            self.uuid = self.meta["dc:identifier"]
        file_name = self.meta["dc:title"]
        # save file
        normalize_file_name = re.sub('[^a-zA-Z0-9  \n\.]', "_", file_name).replace(" ", "_")
        config_path = path.join(self.workspace, "%s.xml" % normalize_file_name)
        if path.exists(config_path):
            self.clean_all_workspace_configs()
        with open(config_path, "w") as file:
            file.write(self.xml)
            file.close()
        self._commit_changes("add new file : %s.xml " % normalize_file_name)
    
    def _register_config(self):
        '''
        Index config metadata in register.
        Use to search config by DCAT RDF metadata.
        '''
        list_heads = [head.name for head in self.repo.heads]

        self.register["configs"][self.uuid] = ConfigModel(
            id = self.uuid,
            titre = self.meta["dc:title"],
            creator = self.meta["dc:creator"],
            versions = list_heads,
            keywords = self.meta["dc:keywords"]
        ).as_dict()
    
    def clean_all_workspace_configs(self):
        for file in glob.glob("%s/*.xml" % self.workspace):
            remove(file)

    def update_config(self, data):
        '''
        Read and update XML from request body data
        '''
        self._read_xml_data(data)
        self.clean_all_workspace_configs()
        self.create_config()