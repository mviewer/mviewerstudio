import git
from datetime import datetime
from typing import List, NoReturn

import os
class Version_manager:
    def __init__(self, config, work_dir) -> None:
        self.config = config
        self.workspace = os.path.join(work_dir, config.id)
        self.repo = git.Repo(self.workspace)
        active_branch = self.repo.active_branch
        active_branch.checkout()
    
    def create_version(self):
        now = datetime.now().isoformat()
        self.create_branch(now, "", True)
    
    def create_branch(self, name, parent, checkout):
        if parent:
            new_branch = self.repo.create_head(name, parent)
        else :
            new_branch = self.repo.create_head(name)
        if checkout:
            self.repo.head.reference = new_branch
    
    def create_tag(self, name, branch_ref = "", message = ""):
        if name and branch_ref and message:
            self.repo.create_tag(
                name,
                ref=branch_ref,
                message=message
            )
        elif name and branch_ref:
            self.repo.create_tag(
                name,
                ref=branch_ref
            )
    
    def list_versions(self) -> List:
        '''
        return branches
        '''
        return [branch for branch in self.repo.branches]
    
    def list_status(self) -> List:
        '''
        return tags sorted by date
        '''
        return self.repo.tags
