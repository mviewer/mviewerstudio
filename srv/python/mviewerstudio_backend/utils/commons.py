from os import walk, remove, path, mkdir


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
