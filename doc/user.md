# Documentation utilisateur



mviewerstudio est une application qui permet de générer et de déployer des applications [mviewer](https://github.com/geobretagne/mviewer)

![Interface studio](img/studio.png)


# Prérequis

Avant de vous lancer dans la belle aventure du mviewer studio et de goûter les joies de monter sa propre application cartographique, vous devrez malgré tout vous être assuré.e d'avoir rempli les prérequis suivants :

 - Le cas échéant, avoir demandé **les droits** aux administrateurs   
   pour vous connecter à l’application mviewerstudio.
  -  Avoir déposé le ou les jeux de données "métier" nécessaires sur un catalogue en **flux OGC** en respectant les    recommandations
   ([exemple sur GéoBretagne](https://cms.geobretagne.fr/content/deposer-des-donnees-shapefile-sur-geobretagne-grace-pydio)).
 - Avoir créé la ou les **fiches de métadonnées** nécessaires sur le catalogue partenaire (ou sur son propre catalogue CSW).
  -   Disposer des **fichiers de styles SLD** nécessaires.

*N.B sur GéoBretagne : pour plus de confort et d’autonomie, il est fortement conseillé d’être [administrateur délégué](https://cms.geobretagne.fr/content/administration-deleguee-sur-geoserver) de ses données sur GéoBretagne.*


# Paramétrer son application

![Paramétrage application](img/interface-studio.png)

 **1.** Renseigner le titre de votre application cartographique _(ex. "Le plan vélo de la Communauté de communes de Châteaugiron")_

**2.** Régler l'emprise de votre carte en utilisant les zoom +/- et le déplacement en cliquant à la souris sur la carte _(ex. ici on zoome sur le territoire de la Communauté de communes de Châteaugiron, ce sera le cadrage "par défaut" sur lequel arrivera l'utilisation sur l'application cartographique)_

**3.** Renseigner l'URL du logo de l'entité productrice de l'application** _**(info : sur GéoBretagne, les logos des partenaires sont stockés ici**_ [**https://geobretagne.fr/pub/logo/**](https://geobretagne.fr/pub/logo/)_**. Il apparaîtra dans le bandeau de l'application)**_

**4.** Cocher les options d'outils que vous souhaitez voir dans la carte  _(ex. des outils de mesures et un export au format image_)


À ce stade, vous pouvez déjà **sauvegarder votre application** et explorer le menu du haut :

![Sauvegarde application](img/sauvegarde-application.png)

**1. Sauvegarder** : pour enregistrer votre fichier de configuration (xml) sur l'espace du mviewer studio

**2. Prévisualiser** : pour pouvoir visualiser le résultat de votre application à tout moment

**3. Télécharger :** pour télécharger votre fichier xml de configuration en local

**4. Charger :** pour charger sur le mviewer studio un fichier xml existant en local

Exemple après avoir sauvegardé, je clique sur "**Prévisualiser**" et je visualise déjà le résultat de mon application à ce stade :

![Prévisualiser application](img/previsualiser-application.png)

# Organiser ses données et thématiques

![Thematique-Donnees](img/thematique-donnes.png)

Le mot "**données**" correspond à un ou des jeu(x) de données que vous souhaitez ajouter à votre application. Vous avez la possibilité de regrouper un ou plusieurs jeux de données sous une "**thématique**". Exemple, je veux ajouter les deux couches de données (linéaire du plan vélo et des abris vélo) sous une thématique "Plan Vélo".

![Selection-Donnees](img/selection-donnees.png)

**1.Créer **: pour créer votre thématique et y associer vos jeux de données "métier"

**2. Importer **: pour réutiliser une thématique déjà créée au sein de la communauté mviewer (ex. la thématique des découpages territoriaux qui contient les limites de communes, EPCI et départements

## Option - Créer une thématique
![Créer-thématique](img/creer-thematique.png)

En cliquant sur "**Ajouter des données**", vous pouvez chercher un jeu de données dans le catalogue (ex. GéoBretagne), soit **(1)** par mot-clé (cas le plus courant), soit **(2)** en renseignant l'adresse du catalogue fournisseur (ou du service WMS) :

![Rechercher-donnees](img/rechercher-donnees.png)

Les données nécessaires ont été ajoutées à la thématique, vous cliquez sur **OK** (pensez à sauvegarder et télécharger votre fichier de configuration !) :

![Ajout-donnees-thematique](img/ajout-donnee-thematique.png)


Pour modifier la façon de **visualiser/interroger** un jeu de données, cliquez ici :
![Visualiser-interroger-donnees](img/parametrage-donnees.png)

Aller dans les différents onglets faire les paramétrages.

### Onglet Base

La plupart des informations sont récupérées des flux. Si c’est bien renseigné, il n’y a rien à changer à part éventuellement le titre de la donnée qui apparaîtra dans votre application mviewer.
![Onglet-base](img/onglet-base.png)
<!--stackedit_data:
eyJoaXN0b3J5IjpbLTEzNzA4NDM5OTAsLTE3MzQ0MDg1NDMsLT
EzMDQ2MzMyNzQsMzQyMDM2ODgsLTIwNjY0MTYyNTIsODkwOTM3
NTkzLDEzNzI1ODExNDMsLTYzMzk2MDExOCwtNjYwOTk3NzI2LC
0xNzQwOTYwMjgxLDk5Mjk3MzgwNCwxODQ4ODQzODEwLDIzMjYz
MTQyLC0yMTM5NzI0NjU1XX0=
-->