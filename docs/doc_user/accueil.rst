.. Authors : 
.. mviewer team

.. _accueil:

Bien commencer
=====================

mviewerstudio est un générateur d'applications basé sur le visualiseur géographique mviewer_. Il permet à tout utilisateur de créer son application cartographique mviewer en suivant les étapes de l'assistant de configuration.

.. image:: ../_images/user/mviewerstudio_0_accueil.png
              :alt: Interface utilisateur mviewerstudio
              :align: center

Prérequis
-------------------------------------------

Avant de vous lancer dans la belle aventure du mviewer studio et de goûter les joies de monter sa propre application cartographique, vous devrez malgré tout vous être assuré.e d'avoir rempli les prérequis suivants :

- Le cas échéant, disposer d'un compte avec  **les droits suffisants** pour vous connecter au mviewerstudio, si ce n'est pas le cas merci de contacter le.s administrateur.rice.s.
- Avoir déposé le ou les jeux de données "métier" nécessaires sur un catalogue en  **flux OGC**  en respectant les recommandations (exemple sur GéoBretagne_).
- Avoir créé la ou les  **fiches de métadonnées**  nécessaires sur le catalogue partenaire (ou sur son propre catalogue CSW).
- Disposer des  **fichiers de styles** (SLD) nécessaires.

N.B sur GéoBretagne : pour plus de confort et d'autonomie, il est fortement conseillé d'être administrateur délégué_ de ses données.

Construire son application
-------------------------------------------

Deux choix sont offerts à l'utilisateur :

- Ouvrir un projet existant disponible sur un espace de stockage distant (serveur)

.. image:: ../_images/user/mviewerstudio_0_accueil_projet_existant_serveur.png
              :alt: Projet existant serveur
              :align: center

- Ouvrir un projet existant disponible sur un espace de stockage local (fichier XML sur votre ordinateur)

.. image:: ../_images/user/mviewerstudio_0_accueil_projet_existant_local.png
              :alt: Projet existant local
              :align: center


Etapes de création
-------------------------------------------

Le générateur permet de créer son application en trois étapes :

1. Paramétrer son application / Application
2. Définir les thématiques et les données de son application / Thématiques & données
3. Publier son votre application / Publication

L'utilisateur peut basculer entre les étapes en cliquant sur l'étape de son choix via l'arbre de gauche ou via les boutons de bas de page Précédent / Suivant.

Il est aussi possible d'enregistrer  |enregistrer| ou de prévisualiser |previsualiser| son projet tout le long de son parcours de création.

.. |enregistrer| image:: ../_images/user/mviewerstudio_1_application_bouton_enregistrer.png
              :alt: Enregistrer 
	      :width: 70 pt

.. |previsualiser| image:: ../_images/user/mviewerstudio_1_application_bouton_previsualiser.png
              :alt: Prévisualiser 
	      :width: 70 pt

Deux modes sont proposés pour des parcours utilisateur :

- Mode simple par défaut

.. image:: ../_images/user/mviewerstudio_1_application.png
              :alt: Mode simple
              :align: center

- Mode avancé avec des fonctionnalités supplémentaires pour les utilisateurs avancés

.. image:: ../_images/user/mviewerstudio_1_application_avance.png
              :alt: Mode avancé
              :align: center

Crédits
-------------------------------------------

Les liens en bas de page renvoient vers :

- le dépôt du code github
- la documentation sur readthedocs
- une fenêtre crédits avec les ressources utilisées (librairies, icônes, illustrations) :

.. image:: ../_images/user/mviewerstudio_0_accueil_credits.png
              :alt: Crédits
              :align: center



.. _mviewer: https://github.com/geobretagne/mviewer

.. _délégué: https://cms.geobretagne.fr/content/administration-deleguee-sur-geoserver

.. _GéoBretagne: https://cms.geobretagne.fr/content/deposer-des-donnees-shapefile-sur-geobretagne-grace-pydio
