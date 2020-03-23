# Mviewerstudio

Mviewer Studio permet de générer une configuration pour [mviewer](https://github.com/geobretagne/mviewer) de manière graphique.

Application écrite en javascript et php

Configuration
-------------

La configuration s'effectue dans le fichier config.json (à créer à partir d'une copie de config-sample.json).

* **studio_title** : Nom de l'application tel qu'il apparaîtra dans la navbar de l'application et dans le titre de la
page dans votre navigateur internet.

* **upload_service** : Service web utilisé pour stocker les configurations mviewer créées avec le générateur.
Valeur par défaut : ``srv/store.php``. Ne pas oublier d'autoriser l'utilisateur apache à accéder en écriture au répertoire. Il est également possible d'utiliser le service "Doc service" de geOrchestra
(par exemple ``../mapfishapp/ws/mviewer/``). Dans ce dernier cas, les fichiers de configuration sont stockés dans la
base de données de geOrchestra.

* **export_conf_folder** : Dossier utilisé pour le stockage des fichiers de configuration mviewer générés. Ce paramètre
est utilisé si le paramètre précédent est ``srv/store.php``.

* **mviewer_instance** : URL de l'instance mviewer utilisée (par exemple ``http://localhost/mviewer/``)

* **conf_path_from_mviewer** : Chemin permettant de charger le fichier de configuration généré depuis le mviewer.
Le chemin peut être relatif (par exemple ``../mviewer/conf/``).

* **mviewer_short_url** : Utilisation du système d'URL courtes (mviewer/#monappli au lieu de mviewer/?config=apps/monappli.xml):
  * **used** : true | false.
  * **apps_folder** : chemin d'accès depuis le répertoire apps (exemple store pour apps/store).
  
* **external_themes** : Utilisation du mécanisme d'import de thématiques externes (présentes dans d'autres mviewers):
  * **used** : true | false.
  * **url** : chemin d'accès vers liste format json.  
  
* **user_info** : url vers service retournant l'identidé de la personne connectée.
  
* **proxy** : Chemin du proxy par lequel les requêtes envoyées par mviewerstudio passeront.
Valeur par défaut si ce paramètre est absent ``../proxy/?url=``.

* **logout_url** : URL utilisée par le menu de déconnexion.

* **app_form_placeholders** : Exemples de valeurs présentes dans le formulaire de création de l'application :
  * **app_title** : Nom de l'application qui sera créée
  * **logo_url** : URL du logo à afficher dans l'application
  * **help_file** : Nom du fichier contenant l'aide à afficher par l'application.

* **map** : Paramétrage du cadrage initial de la carte grâce aux propriétés center et zoom.
  * **center** : coordonnées du centre de la carte
  * **zoom** : niveau de zoom

* **baselayers** : Cette section concerne le paramétrage des fonds de plan.

* **data_providers** : Cette section concerne le paramétrage des différents fournisseurs de données.

Paramètres d'URL
----------------

Il est possible d'instancier un mviewerstudio avec l'un des 2 paramètres suivants dans l'URL :

* **xml**: URL absolue ou relative (par rapport au fichier index.html de mviewerstudio) d'un fichier XML de 
configuration de mviewer à charger dans mviewerstudio.
* **wmc**: URL absolue ou relative (par rapport au fichier index.html de mviewerstudio) d'un fichier Web Map Context 
(WMC) pour OpenLayers à charger dans mviewerstudio.

mviewerstudio initialise son interface depuis le fichier transmis : thématiques, couches de données en particulier.
Le chargement d'un fichier WMC renseigne moins d'information dans mviewerstudio : le titre de la carte, son emprise 
géographique et ses thématiques/couches.

Limitations
-----------

###Couches WMS

La version actuelle de Mviewer Studio n'est pas encore capable de gérer l'intégralité des types de couches supportés 
par Mviewer. Seules les couches de type WMS peuvent être configurées avec Mviewer Studio. Les autres types de couches 
pourrront être supportés à l'avenir si des contributeurs enrichissent le code source de l'application. 


###Spécificités de GeoServer

Mviewer et Mviewer Studio ont été initialement développés dans un contexte où les couches WMS utilisées étaient 
essentiellement servies par des instances de GeoServer. Certaines de leurs fonctionnalités s'appuient sur des 
spécificités de GeoServer. Même si Mviewer et Mviewer Studio sont capables d'interopérer avec des services WMS 
provenant d'autres logiciels (MapServer, QGIS Server, ESRI par exemple) certaines de leurs fonctions ne pourront être
activées qu'avec GeoServer.

####Filtre CQL

L'une de ces spécificités est le support d'un filtre CQL dans les requêtes GetMap de WMS pour n'afficher que les objets 
vectoriels répondant à filtre atributaire. Il ne s'agit pas d'une fonction standard de WMS. Cette capacité est activée 
dans les options suivantes de Mviewer :
- filter
- attributefilter
- attributefield
- attributevalues
- attributeoperator

Ces options sont manipulées dans les onglets "Filtre" et "Liste de choix" du formulaire d'édition d'une couche de 
Mviewer Studio.