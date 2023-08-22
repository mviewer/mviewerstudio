# MViewerStudio Backend v2

Ce dossier contient la version 2 du backend de mviewerstudio. Cette version est
écrite en python (3.7+) et utilise le framework Flask. Il n'y aucune base de
données, les données sont stockées dans des fichiers json.

## Installation

L'installation est décrite dans la documentation :  

 * [Documentation d'installation python](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html)

### Installation Docker

Vous pouvez utiliser la composition docker présente à la racine du dépot. Le `Dockerfile` permet de construire l'image pour un usage de production.


### Tests

* Lancer les tests unitaires : `pytest mviewerstudio_backend/test.py`
* Vérifier les types : `mypy --ignore-missing mviewerstudio_backend`

