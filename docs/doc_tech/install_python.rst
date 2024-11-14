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

    sudo apt install libxslt1-dev libxml2-dev python3 python3-pip python3-venv
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

- ``<path>`` : Le chemin dans lequel installer mviewerstudio (par défaut le répertoire d'exécution du script)
- ``<branch>`` : La branche à installer (par défaut master)

Exemple pour installer mviewerstudio dans le répertoire ``/git`` en utilisant la branche ``develop`` :

.. code-block:: sh

    sh ./install_backend_python.sh /home/monuser develop


Configuration
=============

Configuration du front
----------------------

Récupérez le fichier ``config-python-sample.json`` (à la racine du projet) et copier son contenu dans le fichier ``/srv/python/mviewerstudio_backend/static/apps/config.json``.
Adaptez ensuite les paramètres selon votre environnement (aidez-vous de la page :ref:`config_front`).

.. warning::
    Le paramètre ``mviewer_instance`` doit finir par ``/``

.. note::
   Le paramètre ``user_info_visible`` est à utiliser si vous instance est sécurisée (avec geOrchestra par exemple).

.. note::
   Le paramètre ``proxy`` est à laisser vide si vous n'utilisez pas de proxy.


Variables d'environnement du backend
------------------------------------

Ces variables doivent être définies dans l'environnement (console batch ou service)

- ``CONF_PATH_FROM_MVIEWER``: répertoire d'accès à partir de l'instance mviewer.
- ``CONF_PUBLISH_PATH_FROM_MVIEWER``: répertoire de publication à partir de l'instance mviewer.
- ``EXPORT_CONF_FOLDER``: répertoire d'accès à partir de l'instance mviewer.
- ``LOG_LEVEL``: Niveau logs (voir https://docs.python.org/3/library/logging.html)
- ``MVIEWERSTUDIO_PUBLISH_PATH``: Répertoire de publication lors du passage du mode brouillon au mode publié.
- ``DEFAULT_ORG``: Nom de l'organisation par défaut à utiliser pour un usage non sécurisé (e.g en dehors d'un georchestra, ANONYMOUS).

Autres Variables
----------------

Pour utiliser les services types OGC (catalogue ou serveurs cartographiques), vous aurez besoin d'utiliser le proxy.
Le Proxy interne proposé par mviewer ("/mviewerstudio/proxy/?url=") utilise un paramètre ``PROXY_WHITE_LIST`` qui doit être complété par tous les domaines (FQDN) des services que vous utiliserez.
Ce paramètre est accessible dans :

- /srv/python/mviewerstudio_backend/settings.py



Lancement de l'application avec Flask
=====================================


.. code-block:: sh

    cd mviewerstudio/srv/python
    source .venv/bin/activate
    export FLASK_APP=python/mviewerstudio_backend.app
    export CONF_PATH_FROM_MVIEWER=apps/store
    export EXPORT_CONF_FOLDER=/home/monuser/mviewer/apps/store/
    export MVIEWERSTUDIO_PUBLISH_PATH=/home/monuser/mviewer/apps/prod
    export CONF_PUBLISH_PATH_FROM_MVIEWER=apps/prod
    export DEFAULT_ORG=megalis
    flask run -p 5007



Mise en production
******************


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

1) Création des dossiers de stockage dans le dossier mviewer/apps
-----------------------------------------------------------------

Création du répertoire de stockage des brouillons (store) et des applications publiées (prod).


 .. code-block:: sh

       mkdir /var/www/mviewer/apps/store
       sudo chown monuser /var/www/mviewer/apps/store
       mkdir /var/www/mviewer/apps/prod
       sudo chown monuser /var/www/mviewer/apps/prod



2) Création du service et activation du service
-----------------------------------------------

Créer le répertoire mviewerstudio dans /var/log

.. code-block:: sh

       sudo mkdir /var/log/mviewerstudio
       sudo chown monuser /var/log/mviewerstudio

Vous devez créer un fichier dans `/etc/systemd/system/mviewerstudio.service`:

 .. code-block:: sh

       sudo nano /etc/systemd/system/mviewerstudio.service


Ajoutez ensuite ce contenu en adaptant les valeurs (chemin, user...) selon votre environnement :

fichier `mviewerstudio.service`

 .. code-block:: sh

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
        ExecStart=/home/monuser/mviewerstudio/srv/python/.venv/bin/gunicorn \
            -b 127.0.0.1:5007 \
            --access-logfile /var/log/mviewerstudio/gunicorn-access.log \
            --log-level info \
            --error-logfile /var/log/mviewerstudio/gunicorn-error.log \
            mviewerstudio_backend.app:app

        StandardOutput=append:/var/log/mviewerstudio//mviewerstudio.log
        StandardError=append:/var/log/mviewerstudio/mviewerstudio.log

        [Install]
        WantedBy=multi-user.target

N'oubliez pas d'adapter le niveau des logs, le répertoire des logs (à créer si nécessaire) avec les bons droits (`monuser` dans cette confiugration devra pouvoir écrire dans `/var/log/mviewerstudio`).

Notre service tournera donc sur le port `5007` une fois démarré.

Activation et démarrage du service :

.. code-block:: sh

       sudo systemctl daemon-reload
       sudo systemctl enable mviewerstudio.service
       sudo systemctl start mviewerstudio.service

A partir de maintenant, il est possible de stopper, redémarrer ou afficher le service avec les commandes :

.. code-block:: sh

       sudo systemctl stop mviewerstudio
       sudo systemctl restart mviewerstudio
       sudo systemctl status mviewerstudio.service

3) Proxyfication du service
---------------------------------

Notre service tourne sur le port 5007. Nous souhaitons que ce service soit accessible sur les ports 80 et 443 à l'adresse **/mviewerstudio/**. Nous allons donc opérer une proxyfication de ce service.

Configuration nginx

.. code-block:: sh

       location /mviewerstudio {
            proxy_pass http://127.0.0.1:5007/;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;
        }

Rechargement de la conf nginx

.. code-block:: sh

       sudo systemctl reload nginx

Configuration apache

.. code-block:: sh

        <Location "/mviewerstudio">
            ProxyPass "http://127.0.0.1:5007"
            ProxyPassReverse "http://127.0.0.1:5007"
        </Location>

Rechargement de la conf apache

.. code-block:: sh

       sudo systemctl reload apache2


Mise à jour de l'application
****************************

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

Pour tout redémarrage de gunicorn, vérifier que le service a bien démarré :

.. code-block:: sh

    systemctl status mviewerstudio

.. warning::

    Il est possible que Git n'ait pas terminé d'écrire un fichier lors de l'arrêt du service.
    Le service peut alors démarrer et s'arréter.

    Si vous constater dans le fichier de log d'erreur gunicorn que c'est bien le cas, redémarrer le service avec la commande ``systemctl restart mviewerstudio``

