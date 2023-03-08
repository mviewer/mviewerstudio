import git
from os import path
from datetime import datetime

class Git_manager:
    def __init__(self, workspace, user) -> None:
        self.workspace = workspace
        self.repo = None
        self.user = user
        self.init_or_get_repo()
    
    def init_or_get_repo(self):
        '''
        Get or init Git app repo.
        '''
        try:
            self.repo = git.Repo(self.workspace)
        except git.exc.GitError:
            self.init_repo()

    def init_repo(self):
        '''
        Create app git repo.
        Will creat preview directory to stock temporary preview files for each application.
        '''
        # create repo
        self.repo = git.Repo.init(self.workspace)
        # init git author
        actor = self.user.username if self.user else "anonymous"
        git.Actor(actor, "anonymous@example.com")
        # gitignore
        ignorefile = path.join(self.workspace, ".gitignore")
        f = open(ignorefile, "w")
        f.write("preview/")

    def create_version(self, msg=""):
        '''
        Create a tag.
        By default, tag name is formated as '2023-02-27-15-37-34'.
        :parameter msg: str tag message
        '''
        self.repo.create_tag(datetime.now().strftime("%Y-%m-%d-%H-%M-%S"), message=msg)
    
    def delete_version(self, version_name):
        '''
        Delete a tag.
        :param version_name: str tag identifier
        '''
        # delete tag
        tag = self.repo.tags[version_name]
        if tag:
            # delete version from tag object
            self.repo.delete_tag(tag)
        if len(self.repo.tags) == 1:
            self.switch_version(self.repo.tags[0].name, True)

    def clean_branch(self):
        '''
        delete all branch except main
        '''
        for head in self.repo.heads:
            if head.name == "master":
                continue
            self.repo.git.branch("-D", head.name)

    def delete_versions(self):
        '''
        Delete all tags
        '''
        # delete tag
        for tag in self.repo.tags:
            if int(tag.name) > 1:
                self.repo.delete_tag(tag)

    def switch_version(self, target, hard = False):
        '''
        Change version.
        :param target: string commit or tag identifier
        :param hard: boolean to reset hard instead simple checkout
        '''
        if target in [tag.name for tag in self.repo.tags]:
            target = "tags/%s" % target
        elif not [commit for commit in list(self.repo.iter_commits()) if commit.hexsha == target]:
            return
        
        self.clean_branch()

        if hard:
            self.repo.git.reset("--hard", target)
        else:
            self.repo.git.checkout(target)


    def commit_changes(self, message):
        '''
        Commit config changes on each save.
        '''
        if not self.repo.tags:
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)
            self.create_version(message)
        elif self.repo.git.diff("--name-only"):
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)

    def get_version(self, name):
        return [tag for tag in self.repo.tags if tag.name == name]

    def get_versions(self):
        '''
        Return dict wich contains tag and commits resume.
        '''
        return {
            "tags": self.get_tags(),
            "commits": self.get_commits()
        }
    
    def get_tags(self):
        '''
        Return each tags as dict
        '''
        tags = []
        for tag in self.repo.tags:
            json_tag = {"name": tag.name}
            if tag.tag and tag.tag.message:
                json_tag["message"] = tag.tag.message
                json_tag["commit"] = tag.tag.object.hexsha
            tags.append(json_tag)
        return tags

    def get_commits(self):
        '''
        Return each commits as dict
        '''
        commits = []
        tags_json = self.get_tags()
        head = self.repo.head
        for commit in list(self.repo.iter_commits(head)):
            commit_json = {
                "message": commit.message,
                "id": commit.hexsha,
                "author": commit.author.name,
                "date": commit.authored_datetime.strftime("%Y-%m-%d-%H-%M-%S"),
                "current": commit.hexsha == self.repo.head.commit.hexsha
            }
            tag = [tag["name"] for tag in tags_json if tag["commit"] == commit.hexsha]
            if tag :
                commit_json["tag"] = tag[0]
            commits.append(commit_json)
        return commits
