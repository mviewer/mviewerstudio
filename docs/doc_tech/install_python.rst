.. Authors :
.. mviewer team

.. _install_python:


Installer mviewerstudio avec Python
===================================

Mviewerstudio est une application web développée en HTML / CSS / PHP / Python. Elle nécessite simplement d'être déployée sur un serveur WEB qui peut être APACHE, NGINX, TOMCAT…

Cette page ne traite que de l'installation du backend avec Python.

Environnement global
********************

Prérequis
=========

Vous aurez besoin :

-  d'installer les dépendances (Linux/Debian):

.. code-block:: sh

    sudo apt install libxslt1-dev libxml2-dev python3 python3-pip curl
    pip install virtualenv

- d'une version Python >= 3.9
- d'une instance mviewer fonctionnelle (/mviewer)

Installation
============

.. note::
    Avant de réaliser l'installation, vous devez avoir connaissance de la différence entre un environnement de
    ``production`` et un environnement de ``développements``.

    ``L’environnement de production`` est la destination finale d’une application web ou d’un site web.
    C'est l'environnement final qui sera accessible par vos utilisateurs.

    ``L’environnement de développement`` représente le contexte dans lequel vous allez réaliser des développements, des modifications du code ou des tests
    avant de réaliser le passage de l'application dans l'environnement de production final.

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

.. warning::
    Cette étape n'est pas obligatoire car vous pouvez directement indiquer le répertoire de votre mviewer (e.g apps/store pour la production).
    Vous devrez cependant veillez à affecter les bons droits pour que le studio puisse écrire et lire dans
    les répertoires ciblés.

Cette étape permet de prévisualiser les cartes réalisées dans ``mviewerstudio`` via un ``mviewer`` disponible.

- Mviewerstudio sauvegarde les dans ``mviewerstudio/srv/python/mviewer_backend/store``
- Mviewer lira les cartes dans ``mviewer/apps/store`` qui pointera en réalité vers le ``/store`` mviewerstudio

.. code-block:: sh

    ln -s /<full_path>/mviewerstudio/srv/python/mviewerstudio_backend/store /<full_path>/mviewer/apps/store

**3. Modifier la configuration frontend**

Ouvrir le fichier : ``/srv/python/mviewerstudio_backend/static/apps/config.json`` et adapter les paramètres (aidez-vous de la page d'explication des paramètres si besoin).

.. warning::
    Le paramètre ``mviewer_instance`` doit finir par ``/``

.. note::
   Le paramètre ``user_info_visible`` est à utiliser si vous instance est sécurisée (avec geOrchestra par exemple).

.. note::
   Le paramètre ``proxy`` est à laisser vide si vous n'utilisez pas de proxy.

.. code-block:: sh

    "studio_title": "Mviewer Studio Megalis"
    "mviewer_instance": "http://localhost/mviewer/",
    "conf_path_from_mviewer": "apps/store/",
    "publish_url": "?config=apps/public/{{config}}.xml",
    "api": "api/app",
    "user_info": "api/user",
    "user_info_visible": false,
    "proxy": "proxy/?url=",
    "mviewer_short_url": {
        "used": true,
        "apps_folder": "store"
        "public_folder": "public"
    },
    "external_themes": {
        "used": true,
        "url": "https://geobretagne.fr/minicatalog/csv"
    },

**4. Ouvrir la configuration backend ``/srv/python/mviewerstudio_backend/settings.py`` et adapter les paramètres**

.. code-block:: sh
    
    CONF_PATH_FROM_MVIEWER = os.getenv("CONF_PATH_FROM_MVIEWER", "apps/store")
    CONF_PUBLISH_PATH_FROM_MVIEWER = os.getenv("CONF_PUBLISH_PATH_FROM_MVIEWER", "apps/publish")
    EXPORT_CONF_FOLDER = os.getenv("EXPORT_CONF_FOLDER", "./store")
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    PROXY_WHITE_LIST = ['geobretagne.fr', 'ows.region-bretagne.fr']
    MVIEWERSTUDIO_PUBLISH_PATH =  os.getenv("MVIEWERSTUDIO_PUBLISH_PATH", "public")
    DEFAULT_ORG = os.getenv("DEFAULT_ORG", "public")

Pour les chemins relatifs, la racine sera en général pour Flask ``/srv/python/mviewerstudiobackend``. 
Avec gunicorn (e.g pour la mise en production), vous devez utiliser des chemin absolus.

- ``CONF_PATH_FROM_MVIEWER``: répertoire d'accès à partir de l'instance mviewer.
- ``CONF_PUBLISH_PATH_FROM_MVIEWER``: répertoire de publication à partir de l'instance mviewer.
- ``EXPORT_CONF_FOLDER``: répertoire d'accès à partir de l'instance mviewer.
- ``LOG_LEVEL``: Niveau logs (voir https://docs.python.org/3/library/logging.html)
- ``PROXY_WHITE_LIST``: Liste des noms de domaine laissé passé par le proxy en mode développement.
- ``MVIEWERSTUDIO_PUBLISH_PATH``: Répertoire de publication lors du passage du mode brouillon au mode publié.
- ``DEFAULT_ORG``: Nom de l'organisation par défaut à utiliser pour un usage non sécurisé (e.g en dehors d'un georchestra, ANONYMOUS).



Mettre en production mviewerstudio
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Environnement de production sans Docker
***************************************

**Cette partie décrit l'installation en production de mviewerstudio sur un serveur Linux (Ubuntu / Debian).**

Prérequis
=========

 - Disposer d'un serveur web (Apache ou Nginx)
 - Disposer d'une instance mviewer sur le même serveur (ex : /var/www/mviewer)
 - Disposer des droits sudo
 - Avoir installé mviewerstudio avec la méthode décrite dans la partie précédante

Objectifs
=========

 - Servir le backend python et le front de studio avec un service Linux
 - Proxyfier ce service avec Nginx ou Apache

Mode opératoire
===============

1) Création du dossier store dans le dossier mviewer/apps

 .. code-block:: sh
   :caption: dossier store

       mkdir /var/www/mviewer/apps/store
       sudo chown monuser /var/www/mviewer/apps/store


2) Création du service et activation du service
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

 .. code-block:: sh
   :caption: création du fichier mviewerstudio.service

       sudo nano /etc/systemd/system/mviewerstudio.service

avec le contenu suivant

 .. code-block:: sh
   :caption: fichier mviewerstudio.service

       [Unit]
        Description=mviewerstudio
        After=network.target

        [Service]
        User=monuser
        Environment="EXPORT_CONF_FOLDER=/var/www/mviewer/apps/store/"
        WorkingDirectory=/home/monuser/mviewerstudio/srv/python
        ExecStart=/home/monuser/mviewerstudio/srv/python/.venv/bin/gunicorn -b 127.0.0.1:5007 mviewerstudio_backend.app:app

        [Install]
        WantedBy=multi-user.target

Notre service tourne sur le port 5007.


.. code-block:: sh
   :caption: Activation et démarrage du service

       sudo systemctl daemon-reload
       sudo systemctl enable mviewerstudio.service
       sudo systemctl start mviewerstudio.service

A partir de maintenant, il est possible de stopper, redémarrer ou afficher le service avec les commandes :

.. code-block:: sh
   :caption: service mviewerstudio

       sudo systemctl stop mviewerstudio
       sudo systemctl restart mviewerstudio
       sudo systemctl status mviewerstudio.service

3) Proxyfication nginx du service
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Notre service tourne sur le port 5007. Nous souhaitons que ce service soit accessible sur les ports 80 et 443 à l'adresse **/mviewerstudio/**. Nous allons donc opérer une proxyfication de ce service.

.. code-block::
   :caption: Configuration nginx

       location /mviewerstudio {
            proxy_pass http://127.0.0.1:5007/;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
        }


.. code-block::
   :caption: Rechargement de la conf nginx

       sudo systemctl reload nginx


Développer avec mviewerstudio
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

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


La configuration backend peut également être définie via des variables d'environnement pour ces paramètres :

.. code-block:: sh

    CONF_PATH_FROM_MVIEWER ( défault = apps/store/)
    CONF_PUBLISH_PATH_FROM_MVIEWER ( défault = apps/publish)
    EXPORT_CONF_FOLDER ( défault = ./store/)

Ces variables peuvent aussi être définies lors du lancement du serveur de développement flask :

.. code-block:: sh

    export CONF_PATH_FROM_MVIEWER ( défault = apps/store/)
    export CONF_PUBLISH_PATH_FROM_MVIEWER ( défault = apps/publish)
    export EXPORT_CONF_FOLDER ( défault = ./store/)
    flask run

 .. note::
    Vérifiez au préalable que le répertoire existe et que le user qui démarre le serveur flask dispose des droits sur ce dossier.


Proxy
***********************************

Pour utiliser les services types OGC (catalogue ou serveurs cartographiques), vous aurez besoin d'utiliser le proxy.

Le Proxy utilise un paramètre ``PROXY_WHITE_LIST`` qui doit être complété par tous les domaines (FQDN) des services que vous utiliserez.

Ce paramètre est accessible dans :

.. code-block:: sh

    /srv/python/mviewerstudio_backend/settings.py


Déboguer le backend
***********************************

Pour debug le backend Python, il est conseillé de créer un nouveau fichier de debug type ``Python > flask`` qui utilisera le fichier ``mviewer_backend/app.py``.

Il vous faudra également veiller à bien utiliser la bonne version de python disponible dans le virtualenv ``srv/python/.venv/bin/python``.

 .. note::
    Avec VS Code, ouvrez dans une nouvelle fenêtre le répertoire ``srv/python`` et cliquer sur ``Exécuter et déboguer``.
    Sélectionner ensuite le type ``Python > Flask``.
    Le serveur se lance alors en mode débogue.

Mise à jour
~~~~~~~~~~~~~~~~~~~~~~~~~

Pour mettre à jour le code source (e.g branche ``develop``), vous pouvez utilisez le script ``mviewerstudio/srv/python/sync.sh`` après un ``git pull``.

Il permet de copier / coller les sources vers le répertoire ``static`` du backend Python.

Pour la mise à jour, voici donc les commandes à exécuter à partir du répertoire ``/mviewerstudio`` :

.. code-block:: sh

    cd /full/path/mviewerstudio
    git pull
    cd srv/python
    sh ./sync.sh pull /full/path/mviewerstudio

Si besoin, réaliser un restart de votre service (e.g gunicorn) : 

.. code-block:: sh

    systemctl restart mviewerstudio

Pour tout redémarrage de gunicorn, vérifier que le service à bien démarrer : 

.. code-block:: sh

    systemctl status mviewerstudio

.. warning::

    Il est possible que Git n'ait pas terminé d'écrire un fichier lors de l'arrêt du service.
    Le service peut alors démarrer et s'arréter.

    Si vous constater dans le fichier de log d'erreur gunicorn que c'est bien le cas, redémarrer le service avec la commande ``systemctl restart mviewerstudio``