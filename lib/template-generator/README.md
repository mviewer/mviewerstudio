# Générateur de template

Cette documentation permet de comprendre le fonctionnement technique et n'est pas une documentation utilisateur, déjà disponible ici : 

https://mviewerstudio.readthedocs.io/fr/stable/doc_user/param_data.html?highlight=g%C3%A9n%C3%A9rateur#configurer-les-composants

## Généralité

Cette petite librairie mviewerstudio permet de sélectionner un type de bloc HTML à partir d'une interface graphique.
Les différentes options de chacun des blocs permettront de paramétrer l'élément selon les possibilités (text, couleur, lien au clic, taille de l'iframe...).

L'objectif est d'accompagner les utilisateurs à saisir des type d'élément HTML et les propriétés adéquates sans faire de code.

Cet outil permettra au finale de réaliser des templates WYSIWYG.

# Créer votre composant de saisie

Nous allons décortiquer un composant en guise d'exemple.

Nous allons repartir d'un composant existant comme l'Iframe :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js


## Un composant pour les gouverner tous

Tous les composants sont des classes qui étendent le composant parent [TemplateComponent.js](https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/TemplateComponent.js).



## Saisir la fiche du composant

Le composant doit avoir une description réutilisée par la grille des composants (un nom, une icône, etc...).

Cette description est contenue dans une méthode `header`:

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/TemplateComponent.js

Pour votre composant, vous devrez adapter les propriétés retournée par cette méthode :

- icon
- title (i18n)
- class
- click => Doit appeler la class qui sera définie plus bas

## Définir les options de saisie

Les options de saisie permettent d'indiquer si la saisie provient d'un champ (`field`), d'une saisie manuelle (`static` car n'évolue pas selon la valeur d'un champ) ou de plusieurs champs (`multi`) :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/TextH1Component.js#L12

Dans le cas d'un composant de saisie libre, seule la valeur `static` serait intéressante.

Au final, cette liste permettra de générer le HTML qui convient pour que l'utilisateur sélectionne un des modes de saisie lorsque le composant sera choisie et prêt à être configuré.

## Définir les attribut à saisir par

Par défaut, un composant est égal à un élément HTML (e.g H1, Button, Iframe...).
Chaque élément à une multitude de propriété mais nous en n'avons qu'une petite liste prise en comptes qui sont les plus utiles pour nos utilisateurs au profil non avancé.

Par exemple, pour le composant type `Number`, nous avons la possiblité de sélectionner :

- le type de saisie pour indiquer le champ source (via une liste de champ ou une saisie manuelle)
- un icon
- une couleur de text
- une couleur de fond
- un icône
- un champ de saisie libre pour le text à afficher

Pour afficher les interfaces qui correspondent à ces options, nous renseignons la variable `attributes` (Array) :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/NumbersComponent.js#L16-L23

Un composant de saisie libre n'aurait aucune de ces options (liste vide), puisque l'utilisateur saisie librement tous les attributs et l'élément HTML.

## Créer une nouvelle classe

Vous devrez donc créer une nouvelle classe qui étend le composant TemplateComponent :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L16

Par défaut, vous pouvez copier / coller ce code pour le constructeur de votre composant :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L17C1-L27C4


La méthode getAttribute est à conserver également dans votre composant : 

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L29C3-L29C36

## Le template de votre composant

Chaque composant fournira un template (String) compatible avec la librairie Mustache.js :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L40-L58

Cet technique permet de simplifier la génération de code HTML à partir de JSON ou d'autre variables (String) concaténables.

A partir du composant de départ IframeComponent, on peut voir que la valeur de la propriété src est fournie par un champ que l'utilisateur a rempli manuellement :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L53

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L34


Notez qu'il est possible de gérer l'affichage d'un composant selon la présence ou non d'une valeur.
Par exemple, il n'est pas souhaitable d'afficher une Iframe si l'utilisateur n'a pas saisie la source.

Nous avons pu gérer ce cas avec la syntax Mustache (contrôle sur la valeur non nulle) : 

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L46C7-L46C23

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L57C9-L57C23


## Le rendu

Le rendu permettra à Mustache de transformer votre composant en code HTML réutilisable par mviewerstudio :

https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/components/library/IframeComponent.js#L29C3-L29C36


## Utiliser votre composant

1. Déclarer le composant dans la librairie TemplateGenerator

Exemple avec le composant IframeComponent :

- https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/TemplateGenerator.js#L14

- https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/TemplateGenerator.js#L25C7-L25C22


2. Dans l'interface de sélection d'un composant

Importez votre composant :

- https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/ComponentsSelector.js#L1

... et rajoutez-le dans la liste :

- https://github.com/mviewer/mviewerstudio/blob/master/lib/template-generator/ComponentsSelector.js#L10-L20


## Documenter votre composant

Vous devrez enfin modifier la documentation existante pour que les utilisateurs comprennent comment utiliser votre composant.

## Testez

Il vous reste à tester.
