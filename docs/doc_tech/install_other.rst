.. Authors :
.. mviewer team

.. _install_other:

Autres types d'installations possibles
======================================

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

TODO