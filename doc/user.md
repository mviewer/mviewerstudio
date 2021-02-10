# Documentation utilisateur



mviewerstudio est une application qui permet de générer et de déployer des applications [mviewer](https://github.com/geobretagne/mviewer)

![Interface studio](img/studio.png)


## Prérequis

Avant de vous lancer dans la belle aventure du mviewer studio et de goûter les joies de monter sa propre application cartographique, vous devrez malgré tout vous être assuré.e d'avoir rempli les prérequis suivants :

 - Le cas échéant, avoir demandé **les droits** aux administrateurs   
   pour vous connecter à l’application mviewerstudio.
  -  Avoir déposé le ou les jeux de données "métier" nécessaires sur un catalogue en **flux OGC** en respectant les    recommandations
   ([exemple sur GéoBretagne](https://cms.geobretagne.fr/content/deposer-des-donnees-shapefile-sur-geobretagne-grace-pydio)).
 - Avoir créé la ou les **fiches de métadonnées** nécessaires sur le catalogue partenaire (ou sur son propre catalogue CSW).
  -   Disposer des **fichiers de styles SLD** nécessaires.

*N.B sur GéoBretagne : pour plus de confort et d’autonomie, il est fortement conseillé d’être [administrateur délégué](https://cms.geobretagne.fr/content/administration-deleguee-sur-geoserver) de ses données sur GéoBretagne.*



## Paramétrer son application
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

## Organiser ses données et thématiques

![Thematique-Donnees application](img/thematique-donnes.png)

Le mot "**données**" correspond à un ou des jeu(x) de données que vous souhaitez ajouter à votre application. Vous avez la possibilité de regrouper un ou plusieurs jeux de données sous une "**thématique**". Exemple, je veux ajouter les deux couches de données (linéaire du plan vélo et des abris vélo) sous une thématique "Plan Vélo".
![Selection-Donnees application](img/selection-donnes.png)
<!--stackedit_data:
eyJoaXN0b3J5IjpbODUzMDE5MTE1LC0yMDY2NDE2MjUyLDg5MD
kzNzU5MywxMzcyNTgxMTQzLC02MzM5NjAxMTgsLTY2MDk5Nzcy
NiwtMTc0MDk2MDI4MSw5OTI5NzM4MDQsMTg0ODg0MzgxMCwyMz
I2MzE0MiwtMjEzOTcyNDY1NV19
-->