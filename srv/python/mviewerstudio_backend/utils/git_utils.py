import git
from datetime import datetime

class Git_manager:
    def __init__(self, workspace) -> None:
        self.workspace = workspace
        self.repo = None
        self.init_or_get_repo()
    
    def init_or_get_repo(self):
        try:
            self.repo = git.Repo(self.workspace)
        except git.exc.GitError:
            self.init_repo()

    def init_repo(self):
        # create repo
        self.repo = git.Repo.init(self.workspace)
        # TODO : rename master to main
        # self.repo.git.checkout("master", "-b", "main")
        # self.repo.git.branch("-D", "master")

    def create_version(self):
        # get tag value
        latest_version = 0
        all_tags = [int(tag.name) for tag in self.repo.tags]
        if all_tags:
            latest_version = max(all_tags)
        new_version = latest_version + 1
        # create tag
        self.repo.create_tag(new_version, message=datetime.now().isoformat())
    
    def delete_version(self, version_name):
        # delete tag
        tag = self.repo.tags[version_name]
        if tag:
            # delete version from tag object
            self.repo.delete_tag(tag)

    def delete_all_branch(self):
        '''
        delete all branch except main
        '''
        for head in self.repo.heads:
            if head.name == "main":
                continue
            self.repo.git.branch("-D", head.name)

    def delete_versions(self):
        # delete tag
        for tag in self.repo.tags:
            if int(tag.name) > 1:
                self.repo.delete_tag(tag)

    def switch_version(self, target, is_start_point):
        target_tags = "tags/%s" % target
        
        self.repo.git.checkout("main")
        self.delete_all_branch()

        if target not in self.get_versions():
            return
        if is_start_point:
            self.repo.git.reset("--hard", target_tags)
        else:
            # create new branch
            self.repo.git.checkout(target_tags, "-b", target)

    def commit_changes(self, message):
        if not self.repo.tags:
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)
            self.create_version()
        elif self.repo.git.diff("--name-only"):
            self.repo.git.add("*")
            self.repo.git.commit("-m", message)

    def get_version(self, name):
        return [tag for tag in self.repo.tags if tag.name == name]

    def get_versions(self):
        return [tag.name for tag in self.repo.tags]
