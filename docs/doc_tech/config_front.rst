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

.. code-block:: json
       :linenos:
	{
		"app_conf": {
			"studio_title": "Mviewer STudio Megalis",
			"api": "api/app",
			"store_style_service": "api/style",
			"mviewer_instance": "/mviewer/",
			"conf_path_from_mviewer": "apps/store/",
			"mviewer_publish": "apps/public"
			"mviewer_short_url": {
				"used": true,
				"apps_folder": "store"
			},
			"external_themes": {
				"used": true,
				"url": "https://geobretagne.fr/minicatalog/csv"
			},
			"user_info": "api/user",
			"export_conf_folder": "/home/debian/mviewer/apps/store/",
			"proxy": "proxy/?url=",
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
				"ortho_ign": {
					"id": "ortho_ign",
					"thumbgallery": "img/basemap/ortho.jpg",
					"title": "IGN",
					"label": "Photographies aériennes IGN",
					"type": "WMTS",
					"url": "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?",
					"layers": "ORTHOIMAGERY.ORTHOPHOTOS",
					"format": "image/jpeg",
					"fromcapacity": "false",
					"attribution": "<a href='https://geoservices.ign.fr' target='_blank'><img src='https://geoservices.ign.fr/images/logoIGN.png'></a>",
					"style": "normal",
					"matrixset": "PM",
					"maxzoom": "22"
				},
				"darkmatter": {
					"id": "darkmatter",
					"thumbgallery": "img/basemap/darkmatter.png",
					"title": "CartoDb",
					"label": "Dark Matter",
					"type": "OSM",
					"url": "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
					"maxzoom": "20",
					"attribution": "Map tiles by  <a href=\"https://cartodb.com/attributions\">CartoDb</a>, under  <a href=\"https://creativecommons.org/licenses/by/3.0/\">CC BY 3.0 </a>"
				},
				"esriworldimagery": {
					"id": "esriworldimagery",
					"thumbgallery": "img/basemap/esriworldwide.jpg",
					"title": "Esri",
					"label": "Esri world imagery",
					"type": "OSM",
					"url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
					"attribution": "<a href=\"https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9\" target=\"_blank\" >Esri world imagery</a>"
				},
				"ortho1": {
					"id": "ortho1",
					"thumbgallery": "img/basemap/ortho.jpg",
					"title": "GéoBretagne",
					"label": "Photo aérienne actuelle GéoBretagne",
					"type": "WMTS",
					"url": "https://tile.geobretagne.fr/gwc02/service/wmts",
					"layers": "satellite",
					"format": "image/png",
					"style": "_null",
					"matrixset": "EPSG:3857",
					"fromcapacity": "false",
					"attribution": "<a href=\"https://geobretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/3a0ac2e3-7af1-4dec-9f36-dae6b5a8c731\" target=\"_blank\" >partenaires GéoBretagne - Megalis Bretagne - IGN - PlanetObserver</a>"
				},
				"ortho_ir": {
					"id": "ortho_ir",
					"thumbgallery": "img/basemap/ir.jpg",
					"title": "GéoBretagne",
					"label": "Photo aérienne infra rouge GéoBretagne",
					"type": "WMTS",
					"url": "https://geobretagne.fr/geoserver/gwc/service/wmts",
					"layers": "photo:ir-composite",
					"format": "image/jpeg",
					"style": "_null",
					"matrixset": "EPSG:3857",
					"fromcapacity": "false",
					"attribution": "<a href=\"https://geobretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/434b82a8-8d3c-4d9f-9eb3-0485f1a63eb6\" target=\"_blank\" >partenaires GéoBretagne - Megalis Bretagne - IGN</a>"
				},
				"osm_google": {
					"id": "osm_google",
					"thumbgallery": "img/basemap/osm_google.png",
					"title": "GéoBretagne",
					"label": "OpenStreetMap GéoBretagne",
					"type": "WMS",
					"url": "https://osm.geobretagne.fr/gwc01/service/wms",
					"layers": "osm:google",
					"format": "image/png",
					"attribution": "GéoBretagne. Données : les contributeurs d'<a href=\"https://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap </a>,  <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">ODbL </a>"
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
				"osm_bzh": {
					"id": "osm_bzh",
					"thumbgallery": "img/basemap/osm.png",
					"title": "OSM BZH",
					"label": "OpenStreetMap en breton",
					"type": "OSM",
					"maxzoom": "20",
					"url": "https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png",
					"attribution": "Kendaolerien <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">OpenStreetMap</a>"
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
						"title": "Catalogue Région Bretagne",
						"url": "https://kartenn.region-bretagne.fr/geonetwork/srv/fre/csw",
						"baseref": "https://kartenn.region-bretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/"
					},
					{
						"title": "Catalogue de la Région Grand Est",
						"url": "https://www.geograndest.fr/geonetwork/srv/fre/csw",
						"baseref": "https://www.geograndest.fr/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
					},
					{
						"title": "Catalogue de la Région Pays de la Loire",
						"url": "https://www.geopal.org/geonetwork/srv/fre/csw",
						"baseref": "https://www.geopal.org/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
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



PHP - Structure du fichier de configuration
-------------------------------------------

Pour PHP, il convient de bien renseigner le paramètre ``is_php`` à ``"true"`` et de bien renseigner les services pour l'entrée ``"php"``

.. code-block:: json
       :linenos:

	{
		"app_conf": {
			"studio_title": "GéoBretagne mviewer studio",
			"mviewer_version":  "3.9",
			"mviewerstudio_version":  "3.2",
			"is_php": "true",
			"php": {
				"upload_service": "srv/php/store.php",
				"delete_service": "srv/php/delete.php",
				"list_service": "srv/php/list.php",
				"store_style_service": "srv/php/store/style.php"
			},
			"api": "api/app",
			"store_style_service": "api/style",
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
			"user_info": "api/user",
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
				"ortho_ign": {
					"id": "ortho_ign",
					"thumbgallery": "img/basemap/ortho.jpg",
					"title": "IGN",
					"label": "Photographies aériennes IGN",
					"type": "WMTS",
					"url": "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?",
					"layers": "ORTHOIMAGERY.ORTHOPHOTOS",
					"format": "image/jpeg",
					"fromcapacity": "false",
					"attribution": "<a href='https://geoservices.ign.fr' target='_blank'><img src='https://geoservices.ign.fr/images/logoIGN.png'></a>",
					"style": "normal",
					"matrixset": "PM",
					"maxzoom": "22"
				},
				"darkmatter": {
					"id": "darkmatter",
					"thumbgallery": "img/basemap/darkmatter.png",
					"title": "CartoDb",
					"label": "Dark Matter",
					"type": "OSM",
					"url": "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
					"maxzoom": "20",
					"attribution": "Map tiles by  <a href=\"https://cartodb.com/attributions\">CartoDb</a>, under  <a href=\"https://creativecommons.org/licenses/by/3.0/\">CC BY 3.0 </a>"
				},
				"esriworldimagery": {
					"id": "esriworldimagery",
					"thumbgallery": "img/basemap/esriworldwide.jpg",
					"title": "Esri",
					"label": "Esri world imagery",
					"type": "OSM",
					"url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
					"attribution": "<a href=\"https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9\" target=\"_blank\" >Esri world imagery</a>"
				},
				"ortho1": {
					"id": "ortho1",
					"thumbgallery": "img/basemap/ortho.jpg",
					"title": "GéoBretagne",
					"label": "Photo aérienne actuelle GéoBretagne",
					"type": "WMTS",
					"url": "https://tile.geobretagne.fr/gwc02/service/wmts",
					"layers": "satellite",
					"format": "image/png",
					"style": "_null",
					"matrixset": "EPSG:3857",
					"fromcapacity": "false",
					"attribution": "<a href=\"https://geobretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/3a0ac2e3-7af1-4dec-9f36-dae6b5a8c731\" target=\"_blank\" >partenaires GéoBretagne - Megalis Bretagne - IGN - PlanetObserver</a>"
				},
				"ortho_ir": {
					"id": "ortho_ir",
					"thumbgallery": "img/basemap/ir.jpg",
					"title": "GéoBretagne",
					"label": "Photo aérienne infra rouge GéoBretagne",
					"type": "WMTS",
					"url": "https://geobretagne.fr/geoserver/gwc/service/wmts",
					"layers": "photo:ir-composite",
					"format": "image/jpeg",
					"style": "_null",
					"matrixset": "EPSG:3857",
					"fromcapacity": "false",
					"attribution": "<a href=\"https://geobretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/434b82a8-8d3c-4d9f-9eb3-0485f1a63eb6\" target=\"_blank\" >partenaires GéoBretagne - Megalis Bretagne - IGN</a>"
				},
				"osm_google": {
					"id": "osm_google",
					"thumbgallery": "img/basemap/osm_google.png",
					"title": "GéoBretagne",
					"label": "OpenStreetMap GéoBretagne",
					"type": "WMS",
					"url": "https://osm.geobretagne.fr/gwc01/service/wms",
					"layers": "osm:google",
					"format": "image/png",
					"attribution": "GéoBretagne. Données : les contributeurs d'<a href=\"https://www.openstreetmap.org/\" target=\"_blank\">OpenStreetMap </a>,  <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">ODbL </a>"
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
				"osm_bzh": {
					"id": "osm_bzh",
					"thumbgallery": "img/basemap/osm.png",
					"title": "OSM BZH",
					"label": "OpenStreetMap en breton",
					"type": "OSM",
					"maxzoom": "20",
					"url": "https://tile.openstreetmap.bzh/br/{z}/{x}/{y}.png",
					"attribution": "Kendaolerien <a href=\"https://www.openstreetmap.org/copyright\" target=\"_blank\">OpenStreetMap</a>"
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
						"title": "Catalogue Région Bretagne",
						"url": "https://kartenn.region-bretagne.fr/geonetwork/srv/fre/csw",
						"baseref": "https://kartenn.region-bretagne.fr/geonetwork/srv/fre/catalog.search#/metadata/"
					},
					{
						"title": "Catalogue de la Région Grand Est",
						"url": "https://www.geograndest.fr/geonetwork/srv/fre/csw",
						"baseref": "https://www.geograndest.fr/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
					},
					{
						"title": "Catalogue de la Région Pays de la Loire",
						"url": "https://www.geopal.org/geonetwork/srv/fre/csw",
						"baseref": "https://www.geopal.org/geonetwork/srv/eng/catalog.search?node=srv#/metadata/"
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

La configuration s'effectue dans le fichier config.json (voir au-dessus pour plus d'information sur le fichier).

Paramètres obligatoires avec Python
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Ces paramètres sont obligatoires avec un backend Python.

- ``api``: URL vers le service (API) du backend Python. Valeur par défaut : ``api/app``.
- ``user_info``: URL vers le service (API) permettant de récupérer les informations de l'utilisateur connecté. Valeur par défaut ``api/user``.
- ``store_style_service`` : URL vers le service (API) à utiliser pour sauvegarder un style. Valeur par défaut ``api/style``.


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

