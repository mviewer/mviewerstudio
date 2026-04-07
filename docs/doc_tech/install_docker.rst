.. Authors :
.. mviewer team

.. _install_docker:

Installation avec Docker
========================

Cette page complète la procédure d'installation du backend Python avec un déploiement conteneurisé.

Docker
~~~~~~

Vous devez avoir installé docker au préalable.

1. Image docker

Une image Docker est disponible avec toutes les informations d'installation :

https://github.com/mviewer/mviewerstudio/edit/master/docker/readme.md


2. Composition docker

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
