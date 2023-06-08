from os import walk, remove, path, mkdir, sep, makedirs
from shutil import make_archive, copyfile, copytree, rmtree, move
import zipfile


def clean_preview(app, app_dir):
    """
    Will remove each XML files in config preview directory
    """
    if not app_dir:
        return

    preview_dir = path.join(app.config["EXPORT_CONF_FOLDER"], app_dir, "preview")
    for root, dirs, files in walk(preview_dir):
        if not files:
            break
        for f in files:
            remove(path.join(preview_dir, f))


def init_preview(app, id):
    """
    Will create preview directory inside given config workspace if necessary.
    """
    config_path = path.join(app.config["EXPORT_CONF_FOLDER"], id)
    if not app or not id or not path.exists(config_path):
        return
    preview_path = path.join(config_path, "preview")
    if not path.exists(preview_path):
        mkdir(path.join(config_path, "preview"))

def create_zip(dir, name):
    tmp_dir = path.join(dir, "tmp")
    zip_dir = path.join(tmp_dir, name)
    zip_space = path.join(zip_dir, name)
    zip_file = path.join(tmp_dir, "%s.zip" % name)
    
    if path.exists(tmp_dir):
        rmtree(tmp_dir)
    makedirs(zip_dir)

    copyfile(path.join(dir, "%s.xml" % name), path.join(zip_dir, "%s.xml" % name))

    copytree(path.join(dir, name), zip_space)
    #make_archive(path.join(dir, "%s" % name), "zip", root_dir=zip_dir,base_dir=zip_dir)
    custom_make_archive(zip_dir, zip_file)
    archive = None
    with zipfile.ZipFile(zip_file, "r") as zip:
        archive = zip
    return archive

def zipdir(path, ziph):
    # ziph is zipfile handle
    for root, dirs, files in walk(path):
        for file in files:
            ziph.writestr(path.join(root, file), path.relpath(path.join(root, file), path.join(path, '..')))
def custom_make_archive(source, destination):
    base = path.basename(destination)
    name = base.split('.')[0]
    format = base.split('.')[1]
    archive_from = path.dirname(source)
    archive_to = path.basename(source.strip(sep))
    print(source, destination, archive_from, archive_to)
    make_archive(name, format, archive_from, archive_to)
    move('%s.%s'%(name,format), destination)