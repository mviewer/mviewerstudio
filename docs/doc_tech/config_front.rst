.. Authors : 
.. mviewer team

.. _config_front:

Configurer le frontend mviewerstudio
====================================

Structure du fichier de configuration
----------------------------------------------

La configuration du frontend s'effectue dans le fichier ``src/static/config.json`` localisé dans le projet. Ce fichier pilote l'interface web de mviewerstudio et doit être adapté selon votre environnement.

Voici le fichier de configuration frontend à utiliser et à adapter selon votre environnement :

https://github.com/mviewer/mviewerstudio/blob/master/src/static/config.json


Paramètres du fichier de configuration
-------------------------------------------

Paramètres généraux
~~~~~~~~~~~~~~~~~~~

Ces paramètres sont à renseigner dans tous les cas.

- ``studio_title`` : nom de l'application tel qu'il apparaîtra dans la barre de navigation (navbar) de l'application et le titre de la page dans votre navigateur internet.
- ``mviewerstudio_version``: version compatible de mviewerstudio (laisser la valeur par défaut)
- ``mviewer_version``: version compatible mviewer (laisser la valeur par défaut)
- ``mviewer_instance`` : URL de l'instance mviewer utilisée (par exemple http://localhost/mviewer/).
- ``conf_path_from_mviewer`` : Chemin permettant de charger le fichier de configuration généré depuis le mviewer. Le chemin peut être relatif (par exemple ../mviewer/conf/).
- ``mviewer_short_url`` : Utilisation du système d'URL courtes (mviewer/#monappli au lieu de mviewer/?config=apps/monappli.xml).
	- ``used`` : true | false.
	- ``apps_folder`` : chemin d'accès depuis le répertoire apps (exemple store pour apps/store).
	- ``public_folder`` : chemin d'accès depuis le répertoire apps pour les éléments publiés (exemple store pour apps/public).
- ``external_themes`` : Utilisation du mécanisme d'import de thématiques externes (présentes dans d'autres mviewers).
- ``proxy`` : Chemin du proxy par lequel les requêtes envoyées par mviewerstudio passeront si cette valeur est définie.
- ``used`` : Booléen -> Utiliser ``"true"`` pour permettre le chargement et l'utilisation des thématiques externes.
- ``logout_url`` : URL utilisée par le menu de déconnexion.
- ``app_form_placeholders`` : Exemples de valeurs présentes dans le formulaire de création de l'application.
	- ``app_title`` : Nom de l'application qui sera créée.
	- ``logo_url`` : URL du logo à afficher dans l'application.
	- ``help_file`` : Nom du fichier contenant l'aide à afficher par l'application.
	- ``map`` : Paramétrage du cadrage initial de la carte grâce aux propriétés center et zoom.
	- ``center`` : coordonnées du centre de la carte.
	- ``zoom`` : niveau de zoom.
- ``baselayers`` : cette section concerne le paramétrage des fonds de plan.
- ``data_providers`` : cette section concerne le paramétrage des différents fournisseurs de données.


Paramètres obligatoires
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ces paramètres sont obligatoires.

- ``api``: URL vers le service (API) du backend Python. Valeur par défaut : ``api/app``.
- ``user_info``: URL vers le service (API) permettant de récupérer les informations de l'utilisateur connecté. Valeur par défaut ``api/user``.
- ``store_style_service`` : URL vers le service (API) à utiliser pour sauvegarder un style. Valeur par défaut ``api/style``.
- ``publish_url`` : URL de publication à utiliser (par exemple https//public-map/). Si besoin, Apache devra avoir une règle pour orienter cette URL vers le répertoire de publication (voir settings.py - MVIEWERSTUDIO_PUBLISH_PATH).
- ``public_folder`` : voir détail plus bas.


Configuration des proxys
~~~~~~~~~~~~~~~~~~~~~~~~

Le paramètre ``app_conf.proxy`` configure le proxy général des services distants.
Dans ``app_conf.grist``, ``api_url`` définit la base des appels de Studio, ``proxy`` l'URL absolue de l'API du proxy utilisée dans les couches exportées et ``instance_url`` l'adresse publique de Grist.

Consultez :doc:`proxy` pour les valeurs à renseigner, les exemples de déploiement et la configuration CORS côté backend.
