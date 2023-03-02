.. Authors :
.. mviewer team

.. _config:

Configurer mviewerstudio
========================

La configuration s'effectue dans le fichier config.json (à créer à partir d'une copie de config-sample.json).

Structure du fichier de configuration
-------------------------------------------

.. code-block:: json
       :linenos:

	{
		"app_conf": {
			"studio_title": "GéoBretagne mviewer studio",
			"upload_service": "srv/store.php",
			"delete_service": "srv/delete.php",
			"list_service": "srv/list.php",
			"store_style_service": "srv/store/style.php",
			"mviewer_instance": "http://172.16.10.30/mviewer/",
			"conf_path_from_mviewer": "apps/store/",
			"mviewer_short_url": {
				"used": true,
				"apps_folder": "store"
			},
			"external_themes": {
				"used": false,
				"url": "https://geobretagne.fr/minicatalog/csv"
			},
			"user_info": "srv/user_info.php",
			"export_conf_folder": "/var/www/htdocs/mviewer/apps/store/",
			"proxy": "../proxy/?url=",
			"user_info_visible": false,
			"app_form_placeholders": {
				"app_title": "Kartenn",
				"logo_url": "https://geobretagne.fr/pub/logo/region-bretagne.jpg",
				"help_file": "mviewer_help.html"
			},
			"map": {
				"center": [-307903.74898791354, 6141345.088741366],
				"zoom": 7
			},
			"baselayers": {
				"positron": {
					"id": "positron",
					"thumbgallery": "img/basemap/positron.png",
					"title": "CartoDb",
					"label": "Positron",
					"type": "OSM",
					"url": "https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
					"attribution": "Map tiles by  <a href=\"https://cartodb.com/attributions\">CartoDb</a>, under  <a href=\"https://creativecommons.org/licenses/by/3.0/\">CC BY 3.0 </a>"
				},
				"ortho1": {
					"id": "ortho1",
					"thumbgallery": "img/basemap/ortho.jpg",
					"title": "GéoBretagne",
					"label": "Photo aérienne actuelle",
					"type": "WMTS",
					"url": "https://tile.geobretagne.fr/gwc02/service/wmts",
					"layers": "satellite",
					"format": "image/png",
					"style": "_null",
					"matrixset": "EPSG:3857",
					"fromcapacity": "false",
					"attribution": "<a href=\"https://geobretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/3a0ac2e3-7af1-4dec-9f36-dae6b5a8c731\" target=\"_blank\" >partenaires GéoBretagne - Megalis Bretagne - IGN - PlanetObserver</a>"
				},
				"osm": {
					"id": "osm",
					"thumbgallery": "img/basemap/osm.png",
					"title": "OSM",
					"label": "OpenStreetMap",
					"type": "OSM",
					"url": "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
					"attribution": "Données : les contributeurs d'<a href=\"https://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap </a><a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">ODbL </a>"
				},
				"plan_ign": {
					"id": "plan_ign",
					"thumbgallery": "img/basemap/scan-express.jpg",
					"title": "IGN",
					"label": "Plan IGN v2",
					"type": "WMTS",
					"url": "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?",
					"layers": "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
					"format": "image/png",
					"fromcapacity": "false",
					"attribution": "<a href='https://geoservices.ign.fr' target='_blank'><img src='https://geoservices.ign.fr/images/logoIGN.png'></a>",
					"style": "normal",
					"matrixset": "PM",
					"maxzoom": "22"
				}
			},
			"data_providers": {
				"csw": [{
						"title": "Catalogue GéoBretagne",
						"url": "https://geobretagne.fr/geonetwork/srv/fre/csw",
						"baseref": "https://geobretagne.fr/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
					},
					{
						"title": "Catalogue de la Région Grand Est",
						"url": "https://www.geograndest.fr/geonetwork/srv/fre/csw",
						"baseref": "https://www.geograndest.fr/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
					}
				],
				"wms": [{
					"title": "Serveur WMS de la Région",
					"url": "https://ows.region-bretagne.fr/geoserver/rb/wms"
				}]
			},
			"default_params": {
				"layer": {
					"info_format": "text/html"
				}
			}
		}
	}


Paramètres du fichier de configuration
-------------------------------------------

La configuration s'effectue dans le fichier config.json (à créer à partir d'une copie de config-sample.json).

- ``studio_title`` : nom de l'application tel qu'il apparaîtra dans la barre de navigation (navbar) de l'application et le titre de la page dans votre navigateur internet.

- ``upload_service`` : Service web utilisé pour stocker les configurations mviewer créées avec le générateur. Valeur par défaut : srv/store.php. Ne pas oublier d'autoriser l'utilisateur apache à accéder en écriture au répertoire. Il est également possible d'utiliser le service "Doc service" de geOrchestra (par exemple ../mapfishapp/ws/mviewer/). Dans ce dernier cas, les fichiers de configuration sont stockés dans la base de données de geOrchestra.
- ``export_conf_folder``: Dossier utilisé pour le stockage des fichiers de configuration mviewer générés. Ce paramètre est utilisé si le paramètre précédent est srv/store.php ?srv/store.php.
- ``mviewer_instance`` : URL de l'instance mviewer utilisée (par exemple http://localhost/mviewer/).
- ``conf_path_from_mviewer`` : Chemin permettant de charger le fichier de configuration généré depuis le mviewer. Le chemin peut être relatif (par exemple ../mviewer/conf/).
- ``mviewer_short_url`` : Utilisation du système d'URL courtes (mviewer/#monappli au lieu de mviewer/?config=apps/monappli.xml).

        - ``used`` : true | false.
        - ``apps_folder`` : chemin d'accès depuis le répertoire apps (exemple store pour apps/store).
- ``external_themes`` : Utilisation du mécanisme d'import de thématiques externes (présentes dans d'autres mviewers).
- ``used`` : true | false.
- ``url`` : chemin d'accès vers la liste au format json.
- ``user_info`` : url vers service retournant l'identiTé de la personne connectée.
- ``proxy`` : Chemin du proxy par lequel les requêtes envoyées par mviewerstudio passeront. Valeur par défaut si ce paramètre est absent ../proxy/?url=.
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

