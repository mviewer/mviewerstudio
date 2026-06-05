# Docker

## Objectif

Cette composition Docker lance :

- `mviewerstudio` : backend Flask/Gunicorn ;
- `mviewer` : frontend mviewer ;
- `www` : reverse-proxy Nginx exposé sur `http://localhost/` ;
- `qgis-server` : service optionnel, activé via le profil Compose `qgis`.

Par défaut :

- Studio est accessible sur `http://localhost/mviewerstudio/`
- mviewer est accessible sur `http://localhost/mviewer/`
- QGIS Server est proxifié sur `http://localhost/ogc/`
- le conteneur QGIS Server direct est aussi exposé sur `http://localhost:90/`

## Pré-requis

- Docker et Docker Compose installés ;
- les dossiers `./apps` et `./qgis` présents dans le dépôt ;
- le dossier `./qgis` doit être accessible en lecture/écriture pour l'utilisateur qui lance Docker Compose.

La composition monte :

- `./apps` dans Studio et mviewer ;
- `./qgis` dans Studio et QGIS Server ;
- `./src/static/config.json` dans le conteneur Studio.

## Démarrage complet avec QGIS Server

Commande recommandée pour une première exécution ou après modification du code :

```bash
docker compose --profile qgis up -d --build
```

Cette commande :

- construit l'image locale `mviewerstudio` ;
- démarre `mviewerstudio`, `mviewer`, `www` et `qgis-server` ;
- active les fonctions Studio qui dépendent de QGIS Server.

À utiliser quand :

- vous démarrez la stack pour la première fois ;
- vous avez modifié le backend Python, Nginx ou le `Dockerfile` ;
- vous avez besoin de l'import QGIS, du `GetCapabilities` ou des projets `.qgs`.

## Remise à zéro

Pour arrêter la stack et supprimer aussi les volumes anonymes associés :

```bash
docker compose down -v
```

Cette commande :

- arrête tous les conteneurs de la composition ;
- supprime le réseau Docker créé par Compose ;
- supprime les volumes anonymes créés par les services.

Elle ne supprime pas vos fichiers du dépôt comme `./apps` ou `./qgis`, car ce sont des bind mounts locaux.

## Démarrage simple sans QGIS Server

Pour relancer uniquement Studio, mviewer et Nginx, sans le service QGIS :

```bash
docker compose up -d
```

Cette commande :

- démarre `mviewerstudio`, `mviewer` et `www` ;
- ne démarre pas `qgis-server`, car il est derrière le profil `qgis`.

À utiliser quand :

- vous n’avez pas besoin des fonctions QGIS ;
- vous voulez seulement consulter Studio ou mviewer ;
- vous redémarrez rapidement la stack après un `down`.

## Quand utiliser quelle commande

`docker compose --profile qgis up -d --build`

- pour un démarrage complet ;
- pour reconstruire l'image `mviewerstudio` ;
- pour activer QGIS Server.

`docker compose down -v`

- pour repartir d'un état Docker propre ;
- pour forcer un redémarrage complet de la composition.

`docker compose up -d`

- pour un redémarrage rapide sans QGIS Server ;
- pour relancer les services web principaux après un arrêt.

## Build local ou image déjà publiée

Le service `mviewerstudio` peut fonctionner de deux façons dans `docker-compose.yml`.

### 1. Build local de l'image

C'est le mode actuellement configuré dans ce dépôt.

Extrait actuel :

```yaml
mviewerstudio:
  build:
    context: .
    dockerfile: docker/Dockerfile
    network: host
    args:
      UID: "${UID:-1000}"
      GID: "${GID:-1000}"
  pull_policy: build
  image: mviewer/mviewerstudio:qgis
```

Dans ce mode :

- Docker construit l'image à partir du code local ;
- `image:` sert surtout de tag pour l'image construite ;
- les changements dans le dépôt sont pris en compte après `docker compose up -d --build`.

À utiliser quand :

- vous développez localement ;
- vous modifiez Python, Nginx, le `Dockerfile` ou les dépendances ;
- vous voulez tester l'état exact du dépôt courant.

### 2. Utiliser une image officielle déjà construite

Si vous voulez démarrer depuis une image publiée, il faut retirer la section `build:` et conserver seulement `image:`.

Exemple :

```yaml
mviewerstudio:
  image: mviewer/mviewerstudio:latest
  user: "${UID:-1000}:${GID:-1000}"
```

Dans ce mode :

- Docker ne reconstruit pas l'image locale ;
- Compose télécharge ou réutilise l'image distante `mviewer/mviewerstudio:latest` ;
- les modifications locales du code Python ne sont pas embarquées dans le conteneur.

À utiliser quand :

- vous voulez tester une image publiée ;
- vous ne souhaitez pas reconstruire l'image localement ;
- vous cherchez un démarrage plus simple sur une version déjà packagée.

### Comment basculer d'un mode à l'autre

Pour passer en mode image officielle dans `docker-compose.yml` :

- supprimer le bloc `build:` du service `mviewerstudio` ;
- supprimer `pull_policy: build` ;
- remplacer la valeur de `image:` par le tag publié que vous voulez utiliser, par exemple `mviewer/mviewerstudio:latest`.

Pour revenir au mode build local :

- remettre le bloc `build:` ;
- remettre `pull_policy: build` ;
- conserver ou ajuster le tag `image:` utilisé pour nommer l'image locale construite.

## URLs utiles

- Studio : `http://localhost/mviewerstudio/`
- mviewer : `http://localhost/mviewer/`
- QGIS Server via Nginx : `http://localhost/ogc/`
- QGIS Server direct : `http://localhost:90/`

## Notes

- Le service `qgis-server` est optionnel. Sans le profil `qgis`, les routes Studio qui dépendent de QGIS Server ne fonctionneront pas.
- La configuration front par défaut est portée par `src/static/config.json`.
- Le reverse-proxy Nginx est défini dans `docker/nginx/default.conf.template`.
