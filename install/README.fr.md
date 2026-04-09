# Installation

### Prérequis

- Un système Linux avec `bash`
- Python >= 3.9 et `venv`
- `git` pour cloner le dépôt
- `apt` (optionnel) pour installer automatiquement les paquets système

Le script tentera d'installer automatiquement les paquets suivants :
```sh
libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
```

### Documentation en ligne (plus détaillée)

- 📘 [Documentation utilisateur (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_user/accueil.html)
- 🔧 [Guide d'installation (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html)
- ⚙️ [Configuration et administration (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/config_front.html)
- 💻 [Documentation technique (FR)](https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/dev_corner.html)

---

## Installation rapide (avec le script)

### Étape 1 : Cloner le dépôt

```sh
git clone https://github.com/mviewer/mviewerstudio.git
cd mviewerstudio
```

### Étape 2 : Lancer le script d'installation

Depuis la racine du projet :

```sh
bash ./install/install.sh
```

Le script va :
- ✅ Créer l'environnement virtuel dans `.venv`
- ✅ Installer les dépendances Python
- ✅ Configurer les fichiers nécessaires

### Étape 3 : Configuration

Le script affiche les prochaines étapes, notamment :

- Le chemin du fichier de configuration front : `src/static/config.json`
- Les variables d'environnement backend à exporter
- La commande pour démarrer Flask

### Variante : Installation avec clonage dans un répertoire différent

```sh
bash ./install/install.sh <parent_directory> [branch] [directory_name]
```

Exemple :

```sh
bash ./install/install.sh /home/user/git develop mviewerstudio_develop
```

Paramètres :
- `parent_directory` : répertoire parent dans lequel cloner le projet
- `branch` : branche à checkout après le clonage
- `directory_name` : nom du dossier cible (défaut : `mviewerstudio`)

---

## Installation manuelle (étape par étape)

### Étape 1 : Cloner le dépôt

```sh
git clone https://github.com/mviewer/mviewerstudio.git
cd mviewerstudio
```

### Étape 2 : Créer l'environnement virtuel

```sh
python3 -m venv .venv
```

### Étape 3 : Activer l'environnement virtuel

```sh
source .venv/bin/activate
```

### Étape 4 : Installer les dépendances Python

```sh
pip install -r install/requirements.txt
```

---

## Démarrage de l'application

### Étape 1 : Activer l'environnement virtuel

```sh
source .venv/bin/activate
```

### Étape 2 : Configurer les variables d'environnement (si nécessaire)

Consultez `src/static/config.json` pour les configurations front.

### Étape 3 : Lancer Flask

```sh
flask --app src/app.py run -p 5007
```

L'application sera disponible à : `http://localhost:5007`
