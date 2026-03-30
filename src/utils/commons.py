from os import walk, remove, path, mkdir, sep, makedirs
from shutil import make_archive, copyfile, copytree, rmtree, move
import re, unicodedata

"""
Clean preview workspace to avoid spaces with many old files
"""


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


def replace_special_chars(string):
    # Suppression des accents
    phrase = "".join(
        c
        for c in unicodedata.normalize("NFD", string)
        if unicodedata.category(c) != "Mn"
    )
    # Remplacement des espaces et caractères spéciaux par des underscores
    phrase = re.sub(r"[^a-zA-Z0-9_]", "_", phrase)
    return phrase.lower()

    # Remplacer les accents
    string = re.sub(r"[àáâãäå]", "a", string)
    string = re.sub(r"[ç]", "c", string)
    string = re.sub(r"[èéêë]", "e", string)
    string = re.sub(r"[ìíîï]", "i", string)
    string = re.sub(r"[ñ]", "n", string)
    string = re.sub(r"[òóôõö]", "o", string)
    string = re.sub(r"[ùúûü]", "u", string)
    string = re.sub(r"[ýÿ]", "y", string)

    # Remplacer les caractères spéciaux et les espaces par un tiret bas (_)
    string = re.sub(r"[^a-zA-Z0-9_]", "_", string)

    return string.lower()


"""
Prepare preview space
"""


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


"""
Create zip
"""


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
    custom_make_archive(zip_dir, zip_file)

    return zip_file


"""
Ease make_archive use
"""


def custom_make_archive(source, destination):
    base = path.basename(destination)
    name = base.split(".")[0]
    format = base.split(".")[1]
    archive_from = path.dirname(source)
    archive_to = path.basename(source.strip(sep))
    make_archive(name, format, archive_from, archive_to)
    move("%s.%s" % (name, format), destination)
