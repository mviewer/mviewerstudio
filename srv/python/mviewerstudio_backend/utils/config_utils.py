from os import path, mkdir, remove
import logging
import git
import xml.etree.ElementTree as ET
from datetime import datetime
import re
import glob

from ..models.config import ConfigModel

logger = logging.getLogger(__name__)  


'''
This class ease CRUD + versioning configs operations.
A register given by app.register is use as global configs metadata store.
DCAT-RDF Metadata are given by front end (see above ConfigModel).
'''
class Config:
    def __init__(self, data, user, app) -> None:
        
        self.uuid = None
        self.full_xml_path = None
        self.app = app
        self.directory = None
        
        self.user = user
        self._read_xml_data(data)
        self.register = app.register

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
        if self.meta.find(".//{*}identifier") is not None:
            self.uuid = self.meta.find(".//{*}identifier").text

    def get_or_init_workspace(self):
        '''
        Init or retrieve workspace
        '''
        workspace_path = path.join(self.app.config["EXPORT_CONF_FOLDER"], self.uuid)

        if not path.exists(workspace_path):
            # create directory
            mkdir(workspace_path)
            # init git
            self.repo = git.Repo.init(workspace_path)
        return workspace_path
    
    def _get_xml_describe(self):
        '''
        Return metadata from xml DCAT balises
        '''
        xml_parser = ET.fromstring(self.xml)
        return xml_parser.find(".//metadata/{*}RDF/{*}Description")
    
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
        if self.meta.find(".//{*}identifier"):
            self.uuid = self.meta.find(".//{*}identifier").text
        file_name = self.meta.find("{*}title").text
        # save file
        normalize_file_name = re.sub('[^a-zA-Z0-9  \n\.]', "_", file_name).replace(" ", "_")
        self.full_xml_path = path.join(self.workspace, "%s.xml" % normalize_file_name)
        if path.exists(self.full_xml_path):
            self.clean_all_workspace_configs()
        with open(self.full_xml_path, "w") as file:
            file.write(self.xml)
            file.close()
        self._commit_changes("add new file : %s.xml " % normalize_file_name)
    
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

    def as_data(self):
        '''
        Index config metadata in register.
        Use to search config by DCAT RDF metadata.
        '''
        list_heads = [head.name for head in self.repo.heads]

        subject = self.meta.find("{*}subject").text if self.meta.find("{*}subject") is not None else ""
        url = self.full_xml_path.replace(
            self.app.config["EXPORT_CONF_FOLDER"],
            "",
        )
        return ConfigModel(
            id = self.uuid,
            titre = self.meta.find("{*}title").text,
            creator = self.meta.find("{*}creator").text,
            date = datetime.now().isoformat(),
            versions = list_heads,
            keywords = self.meta.find("{*}keywords").text,
            url = url,
            subject = subject,
        )
    
    def as_dict(self):
        return self.as_data().as_dict()