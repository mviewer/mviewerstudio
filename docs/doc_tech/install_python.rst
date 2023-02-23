.. Authors :
.. mviewer team

.. _install_python:

Installer mviewerstudio avec Python
==================================

Mviewerstudio est une application web développée en HTML / CSS / PHP / Python. Elle nécessite simplement d'être déployée sur un serveur WEB qui peut être APACHE, NGINX, TOMCAT…

Cette page ne traite que de l'installation du backend avec Python.

Prérequis
~~~~~~~~~~~~~~

Vous aurez besoin :

-  d'installer les dépendances (Linux/Debian):

.. code-block:: sh

    sudo apt install libxslt1-dev libxml2-dev python3 python3-pip curl
    pip install virtualenv

- d'une instance mviewer fonctionnelle (/mviewer)

Installation
~~~~~~~~~~~~~~

**1. Téléchargez le script d'installation**

.. code-block:: sh

    sudo apt install curl
    curl -O https://raw.githubusercontent.com/mviewer/mviewerstudio/master/srv/python/install_backend_python.sh

Le script utilise 2 paramètres optionnels :

- ``<branch>`` : Le chemin dans lequel installer mviewerstudio (par défaut le répertoire d'exécution du script)
- ``<path>`` : La branche à installer (par défaut master)

Exemple pour installer mviewerstudio dans le répertoire ``/git`` en utilisant la branche ``develop`` :

.. code-block:: sh

    sh ./install_backend_python.sh /home/user/git develop

**2. Ajouter un lien symbolique entre mviewer et mviewerstudio**

Cette étape permet de prévisualiser les cartes réalisées dans ``mviewerstudio`` via un ``mviewer`` disponible.

- Mviewerstudio sauvegarde les dans ``mviewerstudio/srv/python/mviewer_backend/store``
- Mviewer lira les cartes dans ``mviewer/apps/store`` qui pointera en réalité vers le ``/store`` mviewerstudio

.. code-block:: sh

    ln -s /<full_path>/mviewerstudio/srv/python/mviewerstudio_backend/store /<full_path>/mviewer/apps/store

**3. Ouvrir la configuration frontend ``/srv/python/mviewerstudio_backend/static/apps/config.json`` et adapter les paramètres**

(Attention : le paramètre ``mviewer_instance`` doit commencer par ``http`` et finir par ``/``)

.. code-block:: sh

    "mviewer_instance": "http://localhost:5051/",
    "conf_path_from_mviewer": "apps/store/",
    "mviewer_short_url": {
        "used": true,
        "apps_folder": "store"
    },

**4. Ouvrir la configuration backend ``/srv/python/mviewerstudio_backend/settings.py`` et adapter les paramètres**

.. code-block:: sh
    
    CONF_PATH_FROM_MVIEWER = os.getenv("CONF_PATH_FROM_MVIEWER", "apps/store/")
    EXPORT_CONF_FOLDER = os.getenv("EXPORT_CONF_FOLDER", "./store")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    PROXY_WHITE_LIST = ['geobretagne.fr', 'ows.region-bretagne.fr']
        

Mettre en production mviewerstudio
~~~~~~~~~~~~~~

**SECTION A COMPLETER AVEC PYTHON SANS DOCKER.**

Il vous faudra un serveur wsgi pour servir les pages. Exemple de serveur : gunicorn, waitress,
uwsgi. 

A noter aussi que le fichier `docker/Dockerfile-python-backend` propose d'utiliser gunicorn :

```
# Vous pouvez alors installer les requirements, dans un environnements virtuel comme réalisé pour les développements.
# La méthode dépend de vos besoins mais reste similaire à la méthode utilisée pour l'environnement de développement.
#
# lancer le serveur:
gunicorn mviewerstudio_backend.app:app
```

Développer avec mviewerstudio
~~~~~~~~~~~~~~~~~~~~~~~~~

Serveur de développement
***********************************

En développement, vous devez activer le virtualenv pour démarrer le serveur flask en local :

.. code-block:: sh

    cd mviewerstudio/srv/python
    source .venv/bin/activate

Démarrez ensuite le serveur (fichier ``mviewer_backend/app.py``):

.. code-block:: sh

    cd mviewerstudio_backend
    flask run

Accéder à mviewerstudio à l'adresse par défaut ``localhost:5000``.

Pour modifier le port ``5000`` par le port ``XXXX``, utilisez cette commande avec l'option ``-p`` : 

.. code-block:: sh

    flask run -p XXXX


Configuration
***********************************

La configuration frontend est localisée dans :

- ``/srv/python/mviewerstudio_backend/static/apps/config.json``

La configuration backend est localisée dans :

- ``/srv/python/mviewerstudio_backend/settings.py``


Proxy
***********************************

Pour utiliser les services types OGC (catalogue ou serveurs cartographiques), vous aurez besoin d'utiliser le proxy.

Le Proxy utilise un paramètre ``PROXY_WHITE_LIST`` qui doit être complété par tous les domaines (FQDN) des services que vous utiliserez.

Ce paramètre est accessible dans : 

.. code-block:: sh

    /srv/python/mviewerstudio_backend/settings.py


Debugger
***********************************

Pour debug le backend Python, il est conseillé de créer un nouveau fichier de debug type ``Python > flask`` qui utilisera le fichier ``mviewer_backend/app.py``.

Il vous faudra également veiller à bien utiliser la bonne version de python disponible dans le virtualenv ``srv/python/.venv/bin/python``.
