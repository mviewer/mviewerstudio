.. Authors :
.. mviewer team

.. _install_docker:

Installation avec Docker
========================

Cette page complète la procédure d'installation du backend Python avec un déploiement conteneurisé.

Vous devez avoir installé docker au préalable.

**Petit rappel** : on appel "hôte" la machine sur laquelle vous installez et lancez Docker. C'est votre ordinateur (installation locale) ou un serveur. Les conteneurs mviewerstudio, mviewer et Nginx s'exécutent sur cet hôte. Sauf indication contraire, lancez les commandes de cette page dans un terminal de l'hôte, depuis la racine du projet mviewerstudio.

Dans un montage de volume tel que ``./apps:/home/mvuser/apps``, la partie à gauche des deux-points (``./apps``) est le répertoire sur l'hôte et la partie à droite (``/home/mvuser/apps``) est son emplacement dans le conteneur. Les fichiers restent stockés sur l'hôte ; le montage permet au conteneur d'y accéder.

Image docker
~~~~~~~~~~~~

Une image Docker est disponible avec toutes les informations d'installation :

https://github.com/mviewer/mviewerstudio/edit/master/docker/readme.md


Composition docker
~~~~~~~~~~~~~~~~~~

Vous pouvez également utiliser la composition docker disponible à la racine du projet afin d'obtenir mviewer, mviewerstudio et le backend Python :

https://github.com/mviewer/mviewerstudio/blob/master/docker-compose.yml

Vous pouvez ouvrir ce fichier et l'adapter si besoin.

Voici quelques commandes (mémo) avec docker / docker compose compose : 

.. code-block:: sh

	cd /mviewerstudio
  	# start
	docker compose up -d
  	# stop
	docker compose down # stop
	# logs générales
	docker compose logs -f
  	# lister les conteneur et voirs les IDs
  	docker ps -a
	# logs d'un conteneur - remplacer ID par l'id du conteneur
  	docker logs -f ID
  	# bash dans un conteneur - remplacer ID par l'id du conteneur
  	docker exec -it ID bash
  

Pour plus d'informations sud docker et docker compose :

- https://docs.docker.com/engine/install/debian/

- https://docs.docker.com/reference/cli/docker/compose/

- https://wiki-tech.io/Conteneurisation/Docker/Docker-Compose


Utilisateur Docker et permissions des volumes
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Dans ``docker/Dockerfile``, les arguments ``UID`` (identifiant utilisateur) et ``GID`` (identifiant de groupe) valent par défaut ``999``. L'image utilise donc les identifiants ``999:999``. Ces valeurs sont personnalisables lors de la construction :

.. code-block:: sh

    docker build -f docker/Dockerfile --build-arg UID=999 --build-arg GID=999 -t mviewerstudio:local .

Docker Compose utilise par défaut ``1000:1000`` et transmet les variables ``MVIEWERSTUDIO_UID`` et ``MVIEWERSTUDIO_GID`` aux arguments de construction ainsi qu'à la propriété ``user:`` au lancement. Pour utiliser ``999:999``, notamment lors d'une migration depuis la version 4.3.4, ajoutez ces lignes dans le fichier ``.env`` à la racine du projet :

.. code-block:: sh

    MVIEWERSTUDIO_UID=999
    MVIEWERSTUDIO_GID=999

Adaptez ces valeurs aux propriétaires des volumes de votre installation. Le GID peut être différent de l'UID. Avec ``docker run``, utilisez l'option ``--user 999:999`` pour choisir les identifiants au lancement ; les variables d'environnement ``UID`` et ``GID`` seules ne changent pas l'utilisateur du conteneur.

Les répertoires montés doivent être accessibles en écriture par cet utilisateur. Le conteneur ne modifie pas automatiquement leurs propriétaires ni leurs permissions. Pour une installation utilisant ``999:999``, préparez les répertoires depuis la racine du projet avant le démarrage :

.. code-block:: sh

    mkdir -p apps/store apps/public
    sudo chown -R 999:999 apps/store apps/public

Après modification des identifiants dans ``.env``, recréez le conteneur pour appliquer la configuration :

.. code-block:: sh

    docker compose up -d --force-recreate mviewerstudio

Les variables Compose permettent également de sélectionner l'utilisateur d'une image téléchargée sans la reconstruire, à condition que celle-ci autorise cet utilisateur à lire le code de l'application. Pour les permissions détaillées et le cas SFTP, consultez le `guide Docker <https://github.com/mviewer/mviewerstudio/blob/master/docker/README.fr.md#permissions-docker-à-préparer-manuellement>`_.


Gestion des volumes
~~~~~~~~~~~~~~~~~~~

Le schéma suivant représente les conteneurs et le répertoire partagé sur l’hôte : :download:`Télécharger le schéma XML modifiable avec draw.io <docker_volumes.drawio>`. Ouvrez ce fichier dans draw.io (diagrams.net) pour le consulter ou le modifier.

Le fichier ``docker-compose.yml`` utilise des montages de répertoires et de fichiers de l'hôte.

Les chemins relatifs ci-dessous sont définis depuis la racine du projet.

- ``./apps:/home/mvuser/apps`` dans le service ``mviewerstudio`` : stockage persistant des brouillons dans ``apps/store`` et des publications dans ``apps/public``. Studio doit pouvoir écrire dans ces répertoires.
- ``./apps:/usr/share/nginx/html/apps:ro`` dans les services ``mviewer`` et ``www`` : accès aux mêmes configurations XML en lecture seule pour les afficher et les servir par HTTP.
- ``./src/static/config.json:/home/mvuser/src/static/config.json`` dans ``mviewerstudio`` : configuration du frontend conservée sur l'hôte. Le fichier doit exister avant le démarrage et être lisible par l'utilisateur du conteneur.
- ``./docker/nginx:/etc/nginx/templates`` dans ``www`` : modèles de configuration du reverse proxy Nginx. Après leur modification, recréez le service ``www`` pour les appliquer.

Pour stocker les données ailleurs sur le serveur, remplacez ``./apps`` par le même chemin hôte dans les trois services. Par exemple :

.. code-block:: yaml

    services:
      mviewerstudio:
        volumes:
          - /srv/mviewerstudio/apps:/home/mvuser/apps
          - ./src/static/config.json:/home/mvuser/src/static/config.json
      mviewer:
        volumes:
          - /srv/mviewerstudio/apps:/usr/share/nginx/html/apps:ro
      www:
        volumes:
          - ./docker/nginx:/etc/nginx/templates
          - /srv/mviewerstudio/apps:/usr/share/nginx/html/apps:ro

Cet extrait remplace uniquement les blocs ``volumes:`` du fichier Compose existant.

Préparez le nouveau répertoire et ses permissions avec les UID/GID choisis dans la section précédente. Lors d'un déplacement d'une installation existante, arrêtez les services puis copiez les données en conservant leurs permissions avant de modifier les montages.

Si seuls les chemins hôtes changent, les chemins internes restent identiques. Si vous changez aussi les destinations dans les conteneurs, adaptez ``EXPORT_CONF_FOLDER``, ``MVIEWERSTUDIO_PUBLISH_PATH``, les chemins ``CONF_PATH_FROM_MVIEWER`` et ``CONF_PUBLISH_PATH_FROM_MVIEWER``, ainsi que la configuration Nginx et les URL du frontend.

Vérifiez les permissions des données sur l'hôte :

.. code-block:: sh

    ls -ldn apps apps/store apps/public
    sudo chmod -R u+rwX apps/store apps/public

Adaptez ces chemins si vous avez déplacé les données. L'utilisateur de Studio doit pouvoir traverser les répertoires parents et écrire dans les dossiers de données ; les services ``mviewer`` et ``www`` doivent pouvoir lire les fichiers et traverser les répertoires. Un montage ``:ro`` interdit l'écriture mais n'accorde pas de droits de lecture supplémentaires.

Les données montées depuis l'hôte sont conservées lors de la recréation des conteneurs. Sauvegardez le répertoire ``apps`` complet, ``src/static/config.json``, ``.env`` et les configurations Compose et Nginx avant une migration. Arrêtez Studio pendant la copie pour éviter les écritures concurrentes. Pour restaurer, remettez les fichiers aux chemins montés, vérifiez leurs propriétaires et permissions, puis relancez les services.

Si vous remplacez les montages de répertoires par un volume Docker nommé, partagez ce même volume entre les trois services et préparez ses permissions avec les UID/GID retenus. Sa sauvegarde doit être organisée séparément ; ``docker compose down -v`` peut supprimer les volumes nommés gérés par Compose.


Migration : Comment passer vers une installation Docker ?
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Cette procédure concerne une installation versin lancée avec Gunicorn et systemd.
Si vous changez également de version de mviewerstudio, appliquez les étapes correspondantes des :ref:`migration_notes`.

1.Préparer la reprise de l'installation

Repérez les répertoires actuellement utilisés par ``EXPORT_CONF_FOLDER`` (brouillons) et ``MVIEWERSTUDIO_PUBLISH_PATH`` (publications).
Sauvegardez leur contenu complet, y compris les fichiers cachés et les dépôts Git, ainsi que ``src/static/config.json``, les paramètres du backend et la configuration du reverse proxy. Conservez notamment la valeur de ``DEFAULT_ORG`` et les paramètres d'authentification pour retrouver les mêmes organisations et droits d'accès.

Installez Docker et Docker Compose sur l'hôte cible, puis préparez une copie du projet correspondant à la version souhaitée dans un répertoire distinct de l'installation actuelle. Les commandes suivantes sont à exécuter depuis la racine de cette copie. Ne recopiez pas l'environnement virtuel Python : les dépendances sont installées dans l'image Docker.

2.Configurer les conteneurs

Adaptez ``docker-compose.yml`` et ``src/static/config.json`` à votre environnement en reprenant vos paramètres existants et les éventuelles nouvelles clés de configuration. Reportez les variables du service Gunicorn dans la section ``environment:`` du service ``mviewerstudio`` en adaptant les chemins aux conteneurs.

Les modifications locales de ``settings.py`` doivent également être reprises dans ces variables lorsqu'elles sont configurables ainsi.

Configurez les UID/GID dans ``.env`` et préparez les volumes comme indiqué dans les sections précédentes.
Conservez votre valeur de ``DEFAULT_ORG`` : la valeur d'exemple ``my_org`` du fichier Compose ne doit pas remplacer celle de votre installation. Adaptez aussi les URL de mviewer, de publication, du proxy Grist si vous l'utilisez, et le préfixe ``MVIEWERSTUDIO_URL_PATH_PREFIX``.

Les URL utilisées par le navigateur doivent être accessibles depuis le poste de l'utilisateur.

Le service ``www`` expose le port ``80`` de l'hôte par défaut.

Si votre reverse proxy actuel utilise déjà ce port, adaptez ce montage avant de démarrer Docker, par exemple ``127.0.0.1:8080:80``, puis configurez votre reverse proxy pour transmettre les requêtes vers ce port.
Reprenez la configuration HTTPS et la transmission des informations d'authentification de votre installation actuelle.

3.Transférer les données

Arrêtez l'ancien service mviewerstudio avant la copie finale pour éviter les écritures concurrentes.

Adaptez le nom du service à votre installation :

.. code-block:: sh

    sudo systemctl stop mviewerstudio

Copiez le contenu des répertoires existants vers les volumes préparés sur l'hôte Docker.

Dans cet exemple, remplacez les chemins ``/chemin/ancien/...`` par vos répertoires réels ; si les données sont sur une autre machine, transférez-les d'abord sur l'hôte cible en conservant les fichiers cachés et les permissions.

.. code-block:: sh

    mkdir -p apps/store apps/public
    cp -a /chemin/ancien/store/. apps/store/
    cp -a /chemin/ancien/public/. apps/public/

Vérifiez ensuite les propriétaires et les droits des fichiers avec les UID/GID retenus.
Les deux installations ne doivent pas écrire simultanément dans les mêmes données.

4.Démarrer et vérifier l'installation Docker

.. code-block:: sh

    docker compose config --quiet
    docker compose up -d --build
    docker compose ps
    docker compose logs --tail=100 mviewerstudio www

Ouvrez Studio via l'adresse prévue et vérifiez la connexion, la liste des projets existants, l'édition et l'enregistrement d'un brouillon, puis la publication et l'affichage d'une carte dans mviewer. Vérifiez également les liens des cartes déjà publiées ; conservez leurs anciennes URL ou mettez en place les redirections nécessaires si les chemins ont changé.

5.Basculer vers Docker

Une fois les vérifications terminées, faites pointer l'accès public vers l'installation Docker et désactivez le démarrage automatique de l'ancien service. Conservez les sauvegardes et l'ancienne installation jusqu'à validation de la migration. En cas de retour à l'installation précédente, arrêtez les conteneurs et rétablissez le routage et les données sauvegardées ; prenez en compte les modifications effectuées depuis la bascule avant de redémarrer l'ancien service.
