.. Authors :
.. mviewer team

.. _move_to_python:

Migration du backend PHP vers le backend Python
===============================================

Ce document décrit la marche à suivre pour migrer une instance historique de
``mviewerstudio`` utilisant l'ancien backend PHP vers le backend Python
désormais maintenu.

Il complète la documentation existante sans la dupliquer. Pour les détails
d'installation et de configuration, reportez-vous aux pages de documentation
déjà publiées.

Références utiles
-----------------

- Installation du backend Python :
  https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html
- Configuration du frontend :
  https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/config_front.html
- Notes de migration :
  https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/migration_notes.html
- Docker :
  https://github.com/mviewer/mviewerstudio/blob/master/docker/readme.md
- Exemple de configuration frontend :
  https://github.com/mviewer/mviewerstudio/blob/master/src/static/config.json

Ce qui change
-------------

- Le backend PHP n'est plus supporté.
- Le frontend appelle uniquement l'API Python.
- Les brouillons, publications et versions reposent sur le backend Python.
- Les anciens XML issus du mode PHP ne sont pas directement exploitables comme
  des applications Python versionnées.

Voir aussi :
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/migration_notes.html

Préparer la migration
---------------------

Avant toute bascule :

1. Sauvegarder l'ancienne configuration front et les répertoires contenant les
   XML.
2. Identifier les chemins utilisés par l'instance ``mviewer`` pour lire les
   applications.
3. Préparer les dossiers de travail Python, en général :

   - un dossier de brouillons, par exemple ``apps/store``
   - un dossier de publication, par exemple ``apps/prod`` ou ``apps/public``

4. Vérifier qu'une version de Python compatible est disponible.

Pour les prérequis système et l'installation du backend, voir
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html.

Installer le backend Python
---------------------------

Installez ``mviewerstudio`` avec le backend Python en suivant la documentation
d'installation :

- installation manuelle
- ou installation scriptée
- ou déploiement Docker

Référence principale :
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html

Référence Docker :
https://github.com/mviewer/mviewerstudio/blob/master/docker/readme.md

Remplacer la configuration frontend
-----------------------------------

L'ancienne configuration PHP doit être remplacée par la configuration frontend
du studio, compatible avec le backend Python.

Base de départ :

- partir de ``src/static/config.json`` :
  https://github.com/mviewer/mviewerstudio/blob/master/src/static/config.json
- adapter les URLs et chemins à votre environnement

Les paramètres les plus importants à revoir sont :

- ``api``
- ``user_info``
- ``store_style_service``
- ``mviewer_instance``
- ``publish_url``
- ``conf_path_from_mviewer``
- ``mviewer_short_url``
- ``proxy``

Le détail de chaque paramètre est documenté dans
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/config_front.html.

Définir les variables d'environnement du backend
------------------------------------------------

Le backend Python nécessite au minimum les variables suivantes :

- ``CONF_PATH_FROM_MVIEWER``
- ``CONF_PUBLISH_PATH_FROM_MVIEWER``
- ``EXPORT_CONF_FOLDER``
- ``MVIEWERSTUDIO_PUBLISH_PATH``
- ``DEFAULT_ORG``

Selon votre déploiement, vous devrez aussi définir :

- ``LOG_LEVEL``
- ``MVIEWERSTUDIO_URL_PATH_PREFIX``

Les valeurs attendues et les exemples de service ``systemd`` sont décrits dans
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html.

Migrer les XML existants
------------------------

Le point important de la migration est le traitement des anciens XML.

Les XML provenant du fonctionnement historique avec PHP doivent être réimportés
puis réenregistrés dans le studio pour être pris en charge correctement par le
backend Python.

Procédure recommandée :

1. Démarrer l'instance Python.
2. Ouvrir ``mviewerstudio``.
3. Importer chaque ancien XML via l'option ``Depuis un ordinateur``.
4. Vérifier le rendu de l'application.
5. Enregistrer l'application pour que les métadonnées Python soient générées.
6. Publier l'application si nécessaire.

Cette étape est résumée dans
https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/migration_notes.html.

Adapter l'exploitation
----------------------

Après la bascule :

- supprimer les anciens scripts et fichiers de configuration PHP de votre
  déploiement
- retirer tout service Docker ou Apache/PHP devenu inutile
- vérifier les règles de proxy ou de publication côté serveur web
- vérifier que ``mviewer`` lit bien les applications depuis les répertoires
  attendus

Pour une installation Docker, voir
https://github.com/mviewer/mviewerstudio/blob/master/docker/readme.md.

Vérifications après migration
-----------------------------

Contrôles minimaux à effectuer :

1. L'accès à l'interface studio fonctionne.
2. La récupération des informations utilisateur fonctionne.
3. L'enregistrement d'un brouillon fonctionne.
4. La prévisualisation fonctionne.
5. La publication et la dépublication fonctionnent.
6. Les XML publiés sont accessibles depuis ``mviewer``.
7. L'API Swagger est accessible sur ``/swagger``.

Résolution de problèmes
-----------------------

- Si le frontend ne charge pas la configuration, vérifier
  ``src/static/config.json``.
- Si les applications ne s'enregistrent pas, vérifier les droits sur
  ``EXPORT_CONF_FOLDER``.
- Si la publication échoue, vérifier ``MVIEWERSTUDIO_PUBLISH_PATH`` et
  ``CONF_PUBLISH_PATH_FROM_MVIEWER``.
- Si les services distants ne répondent pas, vérifier la configuration
  ``proxy`` et la liste blanche côté backend.

En résumé
---------

La migration PHP vers Python consiste à :

1. installer le backend Python,
2. remplacer l'ancienne configuration PHP par la configuration frontend du studio,
3. configurer les variables d'environnement et les répertoires de stockage,
4. réimporter puis réenregistrer les anciens XML,
5. valider les flux de brouillon, prévisualisation et publication.
