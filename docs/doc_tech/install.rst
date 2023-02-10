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

L'installation avec Python est à lire dans la section dédiée de cette documentation.

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

