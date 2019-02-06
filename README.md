# mviewerstudio
mviewer studio

Configuration
--------------

La configuration s'effectue dans le fichier config.json (à créer à partie d'une copie de config-sample.json). La configuration se décompose en 3 sections.
La première section concerne le paramétrage global de l'application

#### paramètres

* **upload_service**: Service web utilisé pour stocker les configurations mviewer créées avec le générateur. Valeur par défaut : ``srv/store.php``. Il est également possible d'utiliser le service "Doc service" de Georchestra. exemple  ``../mapfishapp/ws/mviewer/``. Dans le dernier cas, les fichiers de configuration sont stockés dans la base georchestra.
* **export_conf_folder**: Dossier utilisé pour le stockage des fichiers de configuration mviewer générés. Ce paramètre est utilisé si le paramètre précédent est ``srv/store.php``.
* **mviewer_instance**: url de l'instance mviewer utilisée. exemple : http://localhost/mviewer/
* **conf_path_from_mviewer**: Chemin permettant de charger le fichier de configuration généré depuis le mviewer. le chemin peut être relatif. Exemple ../mviewer/conf/
* **map** : Paramétrage du cadrage initial de la carte grâce aux propriétés center et zoom.

La deuxième section concerne le paramétrage des fonds de plan.


La dernière section concerne le paramétrage des différents fournisseurs de données.

