import git
from os import path, remove
from datetime import datetime
from .login_utils import current_user
import logging
from time import sleep

logger = logging.getLogger(__name__)


def unlock_repo(repo):
    """
    Force remove git lock file
    """
    lock_file = path.join(repo.working_dir, '.git', 'index.lock')
    remove(lock_file)

def init_repo(workspace):
    """
    Create app git repo.
    Will creat preview directory to stock temporary preview files for each application.
    :param workspace: string workspace absolute path
    :param username: string authent username
    """
    logger.debug("GIT : CREATE NEW REPOSITORY")
    # create repo
    repo = git.Repo.init(workspace)
    # gitignore
    ignorefile = path.join(workspace, ".gitignore")
    f = open(ignorefile, "w")
    f.write("preview/")
    # set user global config
    repo.git.config("user.name", current_user.username)
    repo.git.config("user.email", "fake@email.org")
    repo.git.config("--add", "save.directory", workspace)


def init_or_get_repo(workspace):
    """
    Get or init Git app repo.
    :param workspace: strin workspace absolute path
    """
    repo = None
    logger.debug("GIT : GET REPOSITORY")
    try:
        repo = git.Repo(workspace)
        logger.debug("GIT : REPOSITORY EXISTS")
    except git.exc.GitError:
        init_repo(workspace)
        repo = git.Repo(workspace)
    return repo

def checkout(repo, target, hard=False):
    """
    checkout repo to targeted branch, tag, commit ref.
    Hard allow to reset hard.
    :param repo: GitPython repo object
    :param target: string ref
    :param hard: boolean
    """

    logger.debug(repo.working_dir)

    repo_dir = repo.working_dir
    lock_file = path.join(repo.working_dir, '.git', 'index.lock')
    
    if path.exists(lock_file):
        logger.error(f"GIT : REPO LOCKED {repo_dir}")
        sleep(5)

    if hard:
        logger.debug(f"GIT : RESET HARD {target}")
        repo.git.reset("--hard", target)
    else:
        logger.debug(f"GIT : CHECKOUT {target}")
        repo.git.checkout(target)


class Git_manager:
    def __init__(self, workspace) -> None:
        self.workspace = workspace
        self.repo = None
        # init git author
        self.repo = init_or_get_repo(workspace)

    def get_repo(self):
        """
        Return current repository
        """
        return init_or_get_repo(self.workspace)

    def create_version(self, msg=""):
        """
        Create a tag.
        By default, tag name is formated as '2023-02-27-15-37-34'.
        :param msg: str tag message
        """
        logger.debug("GIT : CREATE TAG")
        self.repo.create_tag(datetime.now().strftime("%Y-%m-%d-%H-%M-%S"), message=msg)

    def delete_version(self, version_name):
        """
        Delete a tag.
        :param version_name: str tag identifier
        """
        # delete tag
        logger.debug("GIT : DELETE VERSION")
        tag = self.repo.tags[version_name]
        if tag:
            # delete version from tag object
            logger.debug("GIT : DELETE TAG")
            self.repo.delete_tag(tag)
        if len(self.repo.tags) == 1:
            self.switch_version(self.repo.tags[0].name, True)

    def clean_branch(self):
        """
        delete all branch except main
        """
        logger.debug("GIT : DELETE BRANCH")
        for head in self.repo.heads:
            if head.name == "master":
                continue
            self.repo.git.branch("-D", head.name)

    def delete_versions(self):
        """
        Delete all tags
        """
        # delete tag
        logger.debug("GIT : DELETE TAG (USER DELETE VERSION)")
        for tag in self.repo.tags:
            if int(tag.name) > 1:
                self.repo.delete_tag(tag)

    def switch_version(self, target, hard=False):
        """
        Change version.
        :param target: string commit or tag identifier
        :param hard: boolean to reset hard instead simple checkout
        """
        logger.debug("GIT : SWITCH TAG")
        if target in [tag.name for tag in self.repo.tags]:
            target = "tags/%s" % target
        elif not [
            commit
            for commit in list(self.repo.iter_commits())
            if commit.hexsha == target
        ]:
            return
        self.clean_branch()

        checkout(self.repo, target, hard)

    def commit_changes(self, message):
        """
        Commit config changes on each save.
        :param message: string message to insert in commit or tag
        """
        logger.debug("GIT : COMMIT CHANGES ON SAVE")
        if not self.repo.tags:
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)
            self.create_version(message)
        elif self.repo.git.diff("--name-only"):
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)

    def create_publication_commit(self, message):
        logger.debug("GIT : CREATE PULICATION COMMIT AS NEW VERSION")
        self.repo.git.add("*")
        self.repo.git.commit("-m", message)
        self.create_version(message)

    def get_version(self, name):
        """
        Return a tag name.
        :param name: return readable tag full name
        """
        logger.debug("GIT : GET VERSION (SEARCH A TAG FROM TAG NAME)")
        return [tag for tag in self.repo.tags if tag.name == name]

    def get_versions(self):
        """
        Return dict wich contains tag and commits resume.
        """
        logger.debug("GIT : READ VERSIONS (COMMITS AND TAGS)")
        return {"tags": self.get_tags(), "commits": self.get_commits()}
    

    def get_tags(self):
        """
        Return each tags as dict
        """
        logger.debug("GIT : READ TAGS")
        tags = []
        for tag in self.repo.tags:
            json_tag = {"name": tag.name}
            if tag.tag and tag.tag.message:
                json_tag["message"] = tag.tag.message
                json_tag["commit"] = tag.tag.object.hexsha
            tags.append(json_tag)
        logger.debug("GIT : READ TAGS SUCCESS ")
        logger.debug(tags)
        return tags

    def get_commits(self):
        """
        Return each commits as dict
        """
        logger.debug("GIT : READ COMMITS")
        commits = []
        tags_json = self.get_tags()
        head = self.repo.head
        for commit in list(self.repo.iter_commits(head)):
            commit_json = {
                "message": commit.message,
                "id": commit.hexsha,
                "author": commit.author.name,
                "date": commit.authored_datetime.strftime("%Y-%m-%d-%H-%M-%S"),
                "current": commit.hexsha == self.repo.head.commit.hexsha,
                "publication": "true" if "publication" in commit.message else "false",
            }
            tag = [tag["name"] for tag in tags_json if tag["commit"] == commit.hexsha]
            if tag:
                commit_json["tag"] = tag[0]
            commits.append(commit_json)
        logger.debug("GIT : READ COMMITS SUCCESS")
        logger.debug(commits)
        return commits
