# Installation

## FR

Le script [`install.sh`](/home/gaetan/projects/mviewer/mvstudio_changes/install/install.sh) permet d'installer mviewerstudio de deux façons :

- depuis le dépôt courant
- en clonant le dépôt dans un répertoire cible

### Prérequis

- un système Linux avec `bash`
- Python 3 et `venv`
- `git` si vous utilisez le mode clonage
- `apt` si vous voulez laisser le script installer automatiquement les paquets système

Le script tente d'installer automatiquement les paquets suivants :

```sh
libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
```

Si `apt` n'est pas disponible, le script continue sans cette étape.

### Utilisation

Depuis la racine du projet :

```sh
bash ./install/install.sh
```

Ce mode :

- utilise le checkout courant
- crée l'environnement virtuel dans `.venv`
- installe les dépendances Python
- utilise le fichier de configuration front `src/static/config.json`

### Utilisation avec clonage

```sh
bash ./install/install.sh <parent_directory> [branch] [directory_name]
```

Exemple :

```sh
bash ./install/install.sh /home/user/git develop mviewerstudio_develop
```

Ce mode :

- clone le dépôt dans `<parent_directory>/<directory_name>`
- change de branche si `branch` est fournie
- installe ensuite l'application dans ce répertoire

### Paramètres

- `parent_directory` : répertoire parent dans lequel cloner le projet
- `branch` : branche à checkout après le clonage
- `directory_name` : nom du dossier cible, `mviewerstudio` par défaut

Si `parent_directory` n'est pas fourni, aucun clonage n'est effectué.

### Après l'installation

Le script affiche les prochaines étapes, notamment :

- le chemin du fichier de configuration front : `src/static/config.json`
- les variables d'environnement backend à exporter
- la commande pour démarrer Flask

Exemple de démarrage :

```sh
source .venv/bin/activate
flask --app src/app.py run -p 5007
```

## EN

The [`install.sh`](/home/gaetan/projects/mviewer/mvstudio_changes/install/install.sh) script supports two installation modes:

- install from the current repository checkout
- clone the repository into a target directory, then install it

### Requirements

- a Linux system with `bash`
- Python 3 and `venv`
- `git` if you use clone mode
- `apt` if you want the script to install system packages automatically

The script tries to install the following system packages:

```sh
libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
```

If `apt` is not available, the script skips that step.

### Usage

From the project root:

```sh
bash ./install/install.sh
```

This mode:

- uses the current checkout
- creates the virtual environment in `.venv`
- installs Python dependencies
- uses the front configuration file `src/static/config.json`

### Usage with clone

```sh
bash ./install/install.sh <parent_directory> [branch] [directory_name]
```

Example:

```sh
bash ./install/install.sh /home/user/git develop mviewerstudio_develop
```

This mode:

- clones the repository into `<parent_directory>/<directory_name>`
- checks out the requested branch if `branch` is provided
- installs the application in that directory

### Parameters

- `parent_directory`: parent directory where the project will be cloned
- `branch`: branch to check out after cloning
- `directory_name`: target directory name, defaults to `mviewerstudio`

If `parent_directory` is not provided, the script does not clone anything.

### After installation

The script prints the next steps, including:

- the front configuration file path: `src/static/config.json`
- the backend environment variables to export
- the command to start Flask

Example startup:

```sh
source .venv/bin/activate
flask --app src/app.py run -p 5007
```
