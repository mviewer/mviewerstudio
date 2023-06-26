.. Authors :
.. mviewer team

.. _install_python:


Installer mviewerstudio avec Python
###################################

Mviewerstudio est une application web développée en HTML / CSS / PHP / Python. Elle nécessite simplement d'être déployée sur un serveur WEB qui peut être APACHE, NGINX, TOMCAT…

Installation
************

Prérequis
=========

Vous aurez besoin :

-  d'installer les dépendances (Linux/Debian):

.. code-block:: sh

    sudo apt install libxslt1-dev libxml2-dev python3 python3-pip curl
    pip install virtualenv

- d'une version Python >= 3.9
- d'une instance mviewer fonctionnelle (/mviewer)

Procédures d'installation
=========================

.. note::
    Avant de réaliser l'installation, vous devez avoir connaissance de la différence entre un environnement de
    ``production`` et un environnement de ``développements``.

    ``L’environnement de production`` est la destination finale d’une application web ou d’un site web.
    C'est l'environnement final qui sera accessible par vos utilisateurs.

    ``L’environnement de développement`` représente le contexte dans lequel vous allez réaliser des développements, des modifications du code ou des tests
    avant de réaliser le passage de l'application dans l'environnement de production final.

Installation manuelle
---------------------

.. code-block:: sh

    #Récupération des sources
    git clone https://github.com/mviewer/mviewerstudio.git
    #Positionnement sur la branche ou la version choisie
    cd mviewerstudio
    git checkout develop
    STATIC_DIR=srv/python/mviewerstudio_backend/static
    #Création du dossier apps
    mkdir -p "${STATIC_DIR}/apps"
    #Copie des dossiers ressources dans le dossier static
    cp -r css img js lib index.html mviewerstudio.i18n.json "${STATIC_DIR}"
    #Création de l'environnement virtuel Python et installation des dépendances
    cd srv/python
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt -r dev-requirements.txt
    pip install -e .




Installation scriptée
---------------------

Téléchargez le script d'installation

.. code-block:: sh

    sudo apt install curl
    curl -O https://raw.githubusercontent.com/mviewer/mviewerstudio/master/srv/python/install_backend_python.sh

Le script utilise 2 paramètres optionnels :

- ``<branch>`` : La branche à installer (par défaut master)
- ``<path>`` : Le chemin dans lequel installer mviewerstudio (par défaut le répertoire d'exécution du script)

Exemple pour installer mviewerstudio dans le répertoire ``/git`` en utilisant la branche ``develop`` :

.. code-block:: sh

    sh ./install_backend_python.sh /home/user/git develop


Configuration
=============

Configuration du front
----------------------

Récupérez le fichier ``config-python-sample.json`` (à la racine du projet) et copier son contenu dans le fichier ``/srv/python/mviewerstudio_backend/static/apps/config.json``.
Adaptez ensuite les paramètres selon votre environnement (aidez-vous de la page d'explication des paramètres si besoin).

.. warning::
    Le paramètre ``mviewer_instance`` doit finir par ``/``

.. note::
   Le paramètre ``user_info_visible`` est à utiliser si vous instance est sécurisée (avec geOrchestra par exemple).

.. note::
   Le paramètre ``proxy`` est à laisser vide si vous n'utilisez pas de proxy.


Variables d'environnement du backend
------------------------------------

- ``CONF_PATH_FROM_MVIEWER``: répertoire d'accès à partir de l'instance mviewer.
- ``CONF_PUBLISH_PATH_FROM_MVIEWER``: répertoire de publication à partir de l'instance mviewer.
- ``EXPORT_CONF_FOLDER``: répertoire d'accès à partir de l'instance mviewer.
- ``LOG_LEVEL``: Niveau logs (voir https://docs.python.org/3/library/logging.html)
- ``PROXY_WHITE_LIST``: Liste des noms de domaine laissé passé par le proxy en mode développement.
- ``MVIEWERSTUDIO_PUBLISH_PATH``: Répertoire de publication lors du passage du mode brouillon au mode publié.
- ``DEFAULT_ORG``: Nom de l'organisation par défaut à utiliser pour un usage non sécurisé (e.g en dehors d'un georchestra, ANONYMOUS).

Lancement de l'application avec Flask
=====================================


.. code-block:: sh

    cd mviewerstudio/srv/python
    source .venv/bin/activate
    export FLASK_APP=python/mviewerstudio_backend.app
    export CONF_PATH_FROM_MVIEWER=apps/store
    export EXPORT_CONF_FOLDER=/home/debian/mviewer/apps/store/
    export MVIEWERSTUDIO_PUBLISH_PATH=/home/debian/mviewer/apps/prod
    export CONF_PUBLISH_PATH_FROM_MVIEWER=apps/prod
    export DEFAULT_ORG=megalis
    flask run -p 5007



Mettre en production mviewerstudio
**********************************


**Cette partie décrit l'installation en production de mviewerstudio sur un serveur Linux (Ubuntu / Debian) avec le backend python.**

Prérequis
=========

 - Disposer d'un serveur web (Apache ou Nginx)
 - Disposer d'une instance mviewer sur le même serveur (ex : /var/www/mviewer)
 - Disposer des droits sudo
 - Avoir installé mviewerstudio avec la méthode décrite dans la partie précédante


Mode opératoire
===============

- Servir le backend python et le front de studio avec un service Linux
- Proxyfier ce service avec Nginx ou Apache

1) Création du dossier store dans le dossier mviewer/apps
---------------------------------------------------------

 .. code-block:: sh
   :caption: dossier store

       mkdir /var/www/mviewer/apps/store
       sudo chown monuser /var/www/mviewer/apps/store


2) Création du service et activation du service
-----------------------------------------------
Vous devez créer un fichier dans `/etc/systemd/system/mviewerstudio.service`:

 .. code-block:: sh
   :caption: création du fichier mviewerstudio.service

       sudo nano /etc/systemd/system/mviewerstudio.service

Ajoutez ensuite ce contenu en adaptant les valeurs (chemin, user...) selon votre environnement :

 .. code-block:: sh
   :caption: fichier mviewerstudio.service

       [Unit]
        Description=mviewerstudio
        After=network.target

        [Service]
        User=monuser
        Environment="EXPORT_CONF_FOLDER=/var/www/mviewer/apps/store/"
        Environment="CONF_PUBLISH_PATH_FROM_MVIEWER=apps/prod"
        Environment="CONF_PATH_FROM_MVIEWER=apps/store"
        Environment="MVIEWERSTUDIO_PUBLISH_PATH=/var/www/mviewer/apps/prod"
        Environment="DEFAULT_ORG=public"
        Environment="LOG_LEVEL=INFO"
        WorkingDirectory=/home/monuser/mviewerstudio/srv/python
        ExecStart=/home/monuser/mviewerstudio/srv/python/.venv/bin/gunicorn -b 127.0.0.1:5007 mviewerstudio_backend.app:app

        [Install]
        WantedBy=multi-user.target

Notre service tournera donc sur le port `5007` une fois démarré.


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
---------------------------------

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

