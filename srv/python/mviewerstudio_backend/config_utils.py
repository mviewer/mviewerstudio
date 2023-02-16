from os import path, mkdir
import logging, uuid
import git

logger = logging.getLogger(__name__)  


class Config:
    def __init__(self, data, user, directory) -> None:
        self.user = user
        self.data = data.decode("utf-8")
        self.xml = self.data.replace("anonymous", user.username)
        self.directory = directory

        # init or create workspace
        self.get_or_init_workspace()
        # init repo
        logger.info(self.workspace)
        self.repo = git.Repo(self.workspace)
        logger.info(self.repo)

    def get_or_init_workspace(self):
        '''
        Init or retrieve workspace
        '''
        workspace_uuid = str(uuid.uuid4().int)[:10]
        workspace_path = path.join(self.directory, workspace_uuid)
        if not path.exists(workspace_path):
            # create directory
            mkdir(workspace_path)
            # init git
            git.Repo.init(workspace_path)
        self.workspace = workspace_path

    def create_config(self):
        # save file
        with open(self.xml_config_path, "w") as file:
            file.write(self.xml)
        # index
        # commit

    def update_config(self, xml):
        # replace file
        # commit
        return