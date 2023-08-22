from os import path, makedirs, remove, mkdir
import logging
import xml.etree.ElementTree as ET
import re
import glob

from .commons import replace_special_chars
from ..models.config import ConfigModel
from .login_utils import current_user
from .git_utils import Git_manager

logger = logging.getLogger(__name__)


def getWorkspace(app, end_path=""):
    """
    Retrieve workspace from path
    :param app: current Flask app instance
    :param path_id: path
    """
    if not end_path:
        return
    return path.join(app.config["EXPORT_CONF_FOLDER"], end_path)


def edit_xml_string(root, attribute, value):
    """
    Tool to find and write inside XML node
    :param root: xml or xml root node object (e.g self.meta in Config class)
    :param attribute: string xml node name to change in root node (e.g "{*}relation")
    :param value: string value to insert in XML node
    """
    attr = root.find(".//{*}%s" % attribute)
    attr.text = value


def write_file(xml, xml_path):
    """
    Will write an xml into file
    :param xml: xml to write in xml path file
    :param xml_path: string xml file path
    """
    xml_to_string = ET.tostring(xml, "utf-8").decode("utf-8")
    file = open(xml_path, "w")
    file.write(xml_to_string)
    file.close()


def clean_xml_from_dir(path):
    """
    Remove each XML found in dir
    :param path: string xml file path
    """
    for file in glob.glob("%s/*.xml" % path):
        remove(file)


def read_xml_file_content(path, node="", all=False):
    """
    Read XML from path and could return xml node or xml as parser
    :param path: string xml file path
    """
    file = open(path, "r")
    xml_str = file.read()
    xml_parser = ET.fromstring(xml_str)
    if node and not all:
        return xml_parser.find(node)
    elif node and all:
        return xml_parser.findall(node)
    return xml_parser


def control_relation(path, relation, id):
    """
    Ease mapping verification between draft and publish xmls
    :param path: string xml publish path
    :param relation: string publish xml file name
    :param id: xml UUID
    """
    content = read_xml_file_content(path)
    org = content.find(".//metadata/{*}RDF/{*}Description//{*}publisher").text
    creator = content.find(".//metadata/{*}RDF/{*}Description//{*}creator").text
    identifier = content.find(".//metadata/{*}RDF/{*}Description//{*}identifier").text
    lastRelation = content.find(".//metadata/{*}RDF/{*}Description//{*}relation").text

    if current_user.normalize_name != org:
        return False
    if current_user.username != creator:
        return False
    if relation != lastRelation:
        return False
    if identifier != id:
        return False
    return True


def replace_templates_url(target_xml, new_path):
    file_to_replace = open(target_xml, "r")
    xml_str = file_to_replace.read()
    xml_parser = ET.fromstring(xml_str)
    layersNode = xml_parser.findall(".//layer")
    for layer in layersNode:
        templateNode = layer.findall(".//template")
        for tpl in templateNode:
            newUrl = path.join(new_path, "%s.mst" % layer.get("id"))
            tpl.set("url", newUrl)
    write_file(xml_parser, target_xml)
    return


"""
This class ease git repo manipulations.
A register from store/register.json is use as global configs metadata store.
DCAT-RDF Metadata are given by front end (see imported ConfigModel).
"""


class Config:
    def __init__(self, data="", app=None, xml=None) -> None:
        """
        :param data: xml as data from request.data
        :param user: user object from authent infos
        :param app: current app context
        :param xml: xml as string
        """
        self.uuid = None
        self.full_xml_path = None
        self.url = None
        self.app = app
        self.directory = None
        if not xml:
            self.xml = self._read_xml_data(data)
        else:
            self.xml = self._read_xml(xml)
        logger.debug("READ XML >> OK")
        if self.xml is not None and app.register:
            self.register = app.register
            # read org
            if not current_user and xml:
                org = self.meta.find("{*}publisher").text
            else:
                org = (
                    current_user.normalize_name
                    if current_user
                    else app.config["DEFAULT_ORG"]
                )
            logger.debug("GET ORG FROM XML OR FROM AUTHENT >> OK")
            # target workspace path
            self.workspace = getWorkspace(app, path.join(org, self.uuid))
            # create or update workspace
            logger.debug("CREATE WORKSPACE")
            self.create_workspace()
            # init or get repo
            logger.debug("INIT GIT REPO")
            self.git = Git_manager(self.workspace)
            self.repo = self.git.repo
            # save xml and git commit
            file = app.register.read_json(self.uuid)
            if file:
                self.directory = file[0]["directory"]
            logger.debug("SAVE XML IN FILE SYSTEM")
            self.create_or_update_config(file)
            logger.debug("SAVE XML IN FILE SYSTEM === OK")

    def _read_xml(self, xml):
        """
        :param xml: str XML config from request
        """
        xml_parser = ET.fromstring(xml)
        self.meta = self._get_xml_describe(xml_parser)
        if self.meta.find(".//{*}identifier") is not None:
            self.uuid = self.meta.find(".//{*}identifier").text
        return xml_parser

    def _read_xml_data(self, data):
        """
        Decode request data body to XML.
        Then, will replace user info if exists.
        :param data: string xml from flask request.data
        """
        # read xml
        self.data = data.decode("utf-8")
        if not data:
            return None

        # keep meta in memory and get UUID app
        return self._read_xml(self.data)

    def create_workspace(self):
        """
        Init or retrieve workspace
        """
        if not path.exists(self.workspace):
            # create directory
            makedirs(self.workspace)
            makedirs(path.join(self.workspace, "preview"))
            makedirs(path.join(self.workspace, "tmp"))

    def _get_xml_describe(self, xml):
        """
        Return metadata from xml DCAT balises
        :param xml: str
        """
        meta_root = xml.find(".//metadata/{*}RDF/{*}Description")
        # replace anonymous infos by user and org infos
        if current_user and current_user.username:
            edit_xml_string(meta_root, "creator", current_user.username)
        if current_user and current_user.normalize_name:
            edit_xml_string(meta_root, "publisher", current_user.normalize_name)
        return meta_root

    def write(self):
        write_file(self.xml, self.full_xml_path)

    def create_or_update_config(self, file=None):
        """
        Create config workspace and save XML as file.
        Will init git file as version manager.
        """
        if file and file[0]["url"]:
            # file already exists
            # we keep xml file name
            self.uuid = file[0]["id"]
            self.full_xml_path = path.join(
                self.app.config["EXPORT_CONF_FOLDER"], file[0]["url"]
            )
            self.url = file[0]["url"]
        else:
            # get meta info from XML
            if self.meta.find(".//{*}identifier"):
                self.uuid = self.meta.find(".//{*}identifier").text

            # normalize file name
            app_name = self.meta.find("{*}title").text[:20]
            normalized_file_name = replace_special_chars(app_name)
            self.directory = normalized_file_name
            # save file
            normalized_xml_file_name = "%s.xml" % normalized_file_name
            self.full_xml_path = path.join(self.workspace, normalized_xml_file_name)
            if not current_user:
                self.url = path.join(
                    self.meta.find("{*}publisher").text,
                    self.uuid,
                    normalized_xml_file_name,
                )
            else:
                self.url = path.join(
                    current_user.normalize_name, self.uuid, normalized_xml_file_name
                )
            # create resources dir to save mst, customs, etc.
            app_dir = path.join(self.workspace, normalized_file_name)
            if not path.exists(app_dir):
                mkdir(app_dir)
                mkdir(path.join(app_dir, "img"))
                mkdir(path.join(app_dir, "css"))
                mkdir(path.join(app_dir, "customlayers"))
                mkdir(path.join(app_dir, "customcontrols"))
                mkdir(path.join(app_dir, "templates"))

        # write file
        self.write()

    def as_data(self):
        """
        Index config metadata in register.
        Use to search config by DCAT RDF metadata.
        """
        subject = (
            self.meta.find("{*}subject").text
            if self.meta.find("{*}subject") is not None
            else ""
        )
        return ConfigModel(
            id=self.uuid,
            title=self.meta.find("{*}title").text,
            creator=self.meta.find("{*}creator").text,
            description=self.meta.find("{*}description").text,
            date=self.meta.find("{*}date").text,
            versions=self.git.get_versions(),
            keywords=self.meta.find("{*}keywords").text,
            publisher=self.meta.find("{*}publisher").text,
            url=self.url,
            subject=subject,
            relation=self.meta.find("{*}relation").text
            if self.meta.find("{*}relation").text
            else "",
            directory=self.directory,
        )

    def as_dict(self):
        """
        Get config as dict.
        """
        return self.as_data().as_dict()

    def get(self, prop):
        dict_data = self.as_data().as_dict()
        if prop not in dict_data:
            return
        return dict_data[prop]
