.. Authors :
.. mviewer team

.. _install_other:

Autres types d'installations possibles
=======================

SI vous ne pouvez installer mviewerstudio via python, il est aussi possible d'utiliser PHP ou docker.

Installer avec le Backend PHP
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. warning:: L'installation via le backend PHP ne donne pas accès à toutes les fonctionnalités disponibles dans mviewerstudio (Exemple : gestion des versions, publication, création de templates...).


Prérequis
*********
Apache 2, PHP 7

Ainsi qu'une instance mviewer fonctionnelle (/mviewer).

Install
*********

Clone du projet dans le répertoire apache :
git clone https://github.com/mviewer/mviewerstudio

Copie du fichier de conf :
cp config-sample.json apps/config.json

Modification des chemins d'accès dans le config.json :

.. code-block:: sh

    "upload_service": "srv/php/store.php",
    "delete_service": "srv/php/delete.php",
    "list_service": "srv/php/list.php",
    "store_style_service": "srv/php/store/style.php",
    "user_info": "srv/php/user_info.php",


Docker
~~~~~~~

Vous pouvez utiliser la composition docker présente à la racine du dépot. Le Dockerfile permet de construire l'image pour un usage de production.


Développer avec le backend mviewerstudio
****************************************

Configuration
~~~~~~~~~~~~~~

La configuration front est localisée dans les fichiers :

- ``/srv/python/mviewerstudio_backend/static/apps/config.json``

La configuration back est localisée dans les fichiers :

- ``/srv/python/mviewerstudio_backend/settings.py``


Proxy
~~~~~

Pour utiliser les services types OGC (catalogue ou serveurs cartographiques), vous aurez besoin d'utiliser le proxy.

Le Proxy utilise un paramètre ``PROXY_WHITE_LIST`` qui doit être complété par tous les domaines (FQDN) des services que vous utiliserez.

Ce paramètre est accessible dans : 

- /srv/python/mviewerstudio_backend/settings.py

