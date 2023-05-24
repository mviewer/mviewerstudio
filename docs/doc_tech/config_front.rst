.. Authors : 
.. mviewer team

.. _config_front:

Configurer le frontend mviewerstudio
====================================

Le frontend Mviewerstudio dispose actuellement de deux backend :

- Python (nouveau)
- PHP (historique)

Selon le backend, il convient d'utiliser la bonne configuration pour la partie frontend.

.. warning::
	Une réflexion est en cours au sein de la communauté mviewerstudio afin de savoir s'il est pertinent de conserver deux backend.
	Un des backend (potentiellement PHP) sera amené à disparaître sur le moyen terme.

Pour savoir quelle configuration utiliser, vous trouverez deux fichiers à la racine du projet :

- config-python-sample.json

A utiliser si vous avez un backend Python. Ce fichier de configuration sera copié automatiquement via le script d'installation (ou à copier manuellement) dans le répertoire ``srv/python/mviewerstudiobackend/static/apps`` sous le nom ``config.json``.

- config-php-sample.json

A utiliser si vous avez un backend PHP. Ce fichier de configuration sera à copier manuellement à la racine sous le nom ``config.json``.

Python - Structure du fichier de configuration
----------------------------------------------

Voici le fichier d'exemple à utiliser et à adapter selon votre environnement : 

https://github.com/mviewer/mviewerstudio/blob/master/config-python-sample.json



PHP - Structure du fichier de configuration
-------------------------------------------

Pour PHP, il convient de bien renseigner le paramètre ``is_php`` à ``"true"`` et de bien renseigner les services pour l'entrée ``"php"``

Voici le fichier d'exemple à utiliser et à adapter selon votre environnement : 

https://github.com/mviewer/mviewerstudio/blob/master/config-php-sample.json


Paramètres du fichier de configuration
-------------------------------------------

La configuration s'effectue dans le fichier config.json (voir au-dessus pour plus d'information sur le fichier).

Paramètres obligatoires avec Python
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ces paramètres sont obligatoires avec un backend Python.

- ``api``: URL vers le service (API) du backend Python. Valeur par défaut : ``api/app``.
- ``user_info``: URL vers le service (API) permettant de récupérer les informations de l'utilisateur connecté. Valeur par défaut ``api/user``.
- ``store_style_service`` : URL vers le service (API) à utiliser pour sauvegarder un style. Valeur par défaut ``api/style``.
- ``publish_url`` : URL de publication à utiliser (par exemple https//public-map/). Si besoin, Apache devra avoir une règle pour orienter cette URL vers le répertoire de publication (voir settings.py - MVIEWERSTUDIO_PUBLISH_PATH).
- ``public_folder`` : voir détail plus bas.

Paramètres obligatoires avec PHP
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ces paramètres sont obligatoires avec un backend PHP.

- ``php`` : Ensemble des URLs des services PHP à renseigner
	- ``upload_service`` : Service web utilisé avec PHP seulement pour stocker les configurations mviewer créées avec le générateur. Valeur par défaut : srv/store.php. Ne pas oublier d'autoriser l'utilisateur apache à accéder en écriture au répertoire. Il est également possible d'utiliser le service "Doc service" de geOrchestra.
	- ``delete_service`` : Service utilisé avec PHP seulement pour supprimer toutes les applications réalisées.
	- ``list_service`` : Service utilisé avec PHP seulement pour lister toutes les applications sauvegardées.
	- ``store_style_service`` : Service utilisé avec PHP seulement pour sauvegarder un style SLD.
- ``user_info`` : url vers service retournant l'identité de la personne connectée.
- ``is_php`` : A renseigner obligatoirement avec la valeur ``"true"`` avec un backend PHP. Il permet d'adapter le frontend mviewerstudio aux fonctionnalités compatibles PHP.

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
	- ``public_folder`` : (pour backend Python seulement) - chemin d'accès depuis le répertoire apps pour les éléments publiés (exemple store pour apps/public).
- ``external_themes`` : Utilisation du mécanisme d'import de thématiques externes (présentes dans d'autres mviewers).
- ``proxy`` : Chemin du proxy par lequel les requêtes envoyées par mviewerstudio passeront. Valeur par défaut si ce paramètre est absent ../proxy/?url=.
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

