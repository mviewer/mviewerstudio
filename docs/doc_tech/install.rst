.. Authors :
.. mviewer team

.. _install:

Installer mviewerstudio
=======================

Mviewerstudio est une application web développée en HTML / CSS / PHP / Python. Elle nécessite simplement d'être déployée sur un serveur WEB qui peut être APACHE, NGINX, TOMCAT…

mviewerstudio peut fonctionner avec 2 backends différents

* PHP
* Python

En fonction du backend retenu, l'installation diffère.

Backend PHP
~~~~~~~~~~~

Prérequis
*********
Apache 2, PHP 7

Ainsi qu'une instance mviewer fonctionnelle (/mviewer)

Install
*********

Clone du projet dans le répertoire apache :
git clone https://github.com/mviewer/mviewerstudio

Copie du fichier de conf :
cp config-sample.json apps/config.json

Modification des chemins d'accès dans le config.json :

.. code-block:: json
       :linenos:

    "upload_service": "srv/php/store.php",
    "delete_service": "srv/php/delete.php",
    "list_service": "srv/php/list.php",
    "store_style_service": "srv/php/store/style.php",
    "user_info": "srv/php/user_info.php",


Backend Python
~~~~~~~~~~~~~~

Prérequis
*********

.. code-block:: sh

    sudo apt install libxslt1-dev libxml2-dev

Ainsi qu'une instance mviewer fonctionnelle (/mviewer)

Install
*********
.. code-block:: sh

    mkdir -p mviewerstudio_backend/static/apps
    cp -r ../../css ../../img ../../index.html ../../js ../../lib mviewerstudio_backend/static/
    cp ../../mviewerstudio.i18n.json mviewerstudio_backend/static/mviewerstudio.i18n.json


Et également fournir une configuration JSON. Une configuration d'exemple est disponible
à la racine du dépot:

.. code-block:: sh

    cp ../../config-python-sample.json mviewerstudio_backend/static/apps/config.json



Attention, il semble que le paramètre `export_conf_folder` ne soit pas pris en compte. Les xml des applications sont donc stockés dans le répertoire (mviewerstudio/srv/python/store/).

Dans mon cas, j'ai dû exécuter la commande suivante pour faire le lien entre le store xml et mviewer

Création du lien dans le dépôt mviewer (répertoire /apps) :

.. code-block:: sh

    ln -s /<full_path>/mviewerstudio/srv/python/store/ /<full_path>/mviewer/apps/store




.. code-block:: sh

    cd srv/python
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt -r dev-requirements.txt
    pip install -e .
    cd  mviewerstudio_backend
    flask run


Docker
~~~~~~~

à compléter...
