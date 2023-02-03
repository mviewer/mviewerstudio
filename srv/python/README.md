# MViewerStudio Backend v2

Ce dossier contient la version 2 du backend de mviewerstudio. Cette version est
écrite en python (3.7+) et utilise le framework Flask. Il n'y aucune base de
données, les données sont stockées dans des fichiers json.

## Installation

### Docker

Vous pouvez utiliser la composition docker présente à la racine du dépot. Le
`Dockerfile` permet de construire l'image pour un usage de production.


## Développement

Vous devrez d'abord copier les ressources statiques de la partie cliente de `mviewerstudio`:

### Prérequis
```bash
sudo apt install libxslt1-dev libxml2-dev

```

Ainsi qu'une instance mviewer fonctionnelle (/mviewer)


```bash
mkdir -p mviewerstudio_backend/static/apps
cp -r ../../css ../../img ../../index.html ../../js ../../lib mviewerstudio_backend/static/
cp ../../mviewerstudio.i18n.json mviewerstudio_backend/static/mviewerstudio.i18n.json
```

Et également fournir une configuration JSON. Une configuration d'exemple est disponible
à la racine du dépot:

```bash
cp ../../config-python-sample.json mviewerstudio_backend/static/apps/config.json

```

Attention, il semble que le paramètre `export_conf_folder` ne soit pas pris en compte. Les xml des applications sont donc stockés dans le répertoire (mviewerstudio/srv/python/store/).

Dans mon cas, j'ai dû exécuter la commande suivante pour faire le lien entre le store xml et mviewer

Création du lien dans le dépôt mviewer (répertoire /apps) :
```bash
ln -s /<full_path>/mviewerstudio/srv/python/store/ /<full_path>/mviewer/apps/store

```


```bash
# mettez vous dans un .venv, ex: python -m venv .venv && source .venv/bin/activate, ou via pew ou pyenv, par exemple:
cd srv/python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r dev-requirements.txt
pip install -e .
cd  mviewerstudio_backend
flask run
```

### tests

* Lancer les tests unitaires : `pytest mviewerstudio_backend/test.py`
* Vérifier les types : `mypy --ignore-missing mviewerstudio_backend`


## Production

Il vous faudra un serveur wsgi pour servir les pages. Exemple de serveur : gunicorn, waitress,
uwsgi. Le fichier `docker/Dockerfile-python-backend` propose d'utiliser gunicorn.

```
# installer les requirements, dans un environnements virtuel par exemple. La méthode dépend de vous.
# mais est similaire à celle en dév.
#
# lancer le serveur:
gunicorn mviewerstudio_backend.app:app
```
