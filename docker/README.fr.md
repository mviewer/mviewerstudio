# mviewerstudio avec Docker

## Image

Seule l'image Docker du backend Python est maintenue ; le backend PHP est abandonné. Exécutez les commandes de ce guide depuis la racine du dépôt.

## Documentation

- [Installation et déploiement Docker](../docs/doc_tech/install_docker.rst)
- [Authentification et variables associées](../docs/doc_tech/authentification.rst)
- [Configuration Keycloak et exemple Compose](../docs/doc_tech/how_to_keycloak.rst)
- [Configuration GeoNode](../docs/doc_tech/how_to_geonode.rst)
- [Configuration geOrchestra Gateway](../docs/doc_tech/how_to_georchestra.rst)

Les procédures de connexion, de gestion des groupes et de déconnexion sont décrites dans ces guides.

## Permissions Docker à préparer manuellement

Le conteneur ne modifie pas automatiquement les propriétaires ni les permissions.

Compose utilise `user:` avec `MVIEWERSTUDIO_UID` et `MVIEWERSTUDIO_GID` (valeurs par défaut : `1000:1000`).

Pour une instance existante utilisant `999:999`, ajoutez ces lignes au fichier `.env` :

```dotenv
MVIEWERSTUDIO_UID=999
MVIEWERSTUDIO_GID=999
```

Avant le démarrage, préparez les dossiers sur l'hôte avec les mêmes identifiants :

```bash
sudo mkdir -p apps/store apps/public
sudo chown -R 999:999 apps/store apps/public
sudo chmod -R u+rwX apps/store apps/public
docker compose up -d --build --force-recreate mviewerstudio
```

Adaptez les chemins aux volumes montés pour `EXPORT_CONF_FOLDER` et `MVIEWERSTUDIO_PUBLISH_PATH`. Les répertoires parents doivent permettre leur traversée par cet utilisateur.

Les commandes récursives changent les fichiers existants : conservez leurs propriétaires si les droits actuels suffisent déjà. Les volumes nommés doivent également être préparés avec les identifiants choisis.

Pour un accès SFTP, vérifiez les identifiants réels du compte sur l'hôte :

```bash
id nom_du_compte_sftp
ls -ldn apps/store apps/public
```

Le GID peut différer de l'UID. Pour un SFTP avec chroot, conservez la racine du chroot sous la propriété de root et non modifiable par le compte SFTP ; appliquez les permissions uniquement aux sous-dossiers de données.

Avec `docker run`, utilisez `--user 999:999`. Les variables `UID` et `GID` seules ne changent pas l'utilisateur au runtime. Après intégration de cette modification, les changements d'identifiants nécessitent seulement de recréer le conteneur.

### Personnaliser les identifiants au build ou au runtime

`1000` est uniquement la valeur par défaut. Dans Compose, les variables `MVIEWERSTUDIO_UID` et `MVIEWERSTUDIO_GID` alimentent les arguments de build `UID`/`GID` et la propriété `user:` au runtime.

Pour définir l'utilisateur par défaut de l'image à la construction :

```bash
docker build -f docker/Dockerfile --build-arg UID=999 --build-arg GID=999 -t mviewerstudio:local .
```

Pour choisir d'autres identifiants au lancement, sans reconstruire l'image :

```bash
docker run --rm --user 1001:1002 -v "$PWD/apps:/home/mvuser/apps" mviewerstudio:local
```

Pour télécharger une image publiée puis lancer le service sans build, configurez `.env` et exécutez :

```bash
docker compose pull mviewerstudio
docker compose up -d --no-build --pull never --force-recreate mviewerstudio
```

L'utilisateur au runtime prime sur celui défini au build. Préparez manuellement les permissions des données pour les identifiants utilisés au runtime.

L’image publiée doit intégrer les droits de lecture du code nécessaires à un UID différent de celui utilisé au build.

## Variables d'environnement

| Variable | Description | Exemple |
| --- | --- | --- |
| `DEFAULT_ORG` | Organisation utilisée si les claims ne fournissent pas d’organisation. | `ARNIA` |
| `LOG_LEVEL` | Niveau de journalisation (défaut : `INFO`). | `INFO` |
| `MVIEWERSTUDIO_PROXY_WHITE_LIST` | Domaines autorisés par le proxy OGC interne, séparés par des virgules. | `geobretagne.fr,ows.region-bretagne.fr` |
| `EXPORT_CONF_FOLDER` | Dossier dans lequel Studio stocke les brouillons et les configurations en cours. | `/home/mvuser/apps/store` |
| `CONF_PATH_FROM_MVIEWER` | Chemin URL utilisé par mviewer pour accéder aux fichiers des brouillons. | `apps/store` |
| `MVIEWERSTUDIO_PUBLISH_PATH` | Dossier dans lequel Studio copie les fichiers lors de la publication. | `/home/mvuser/apps/public` |
| `CONF_PUBLISH_PATH_FROM_MVIEWER` | Chemin URL utilisé par mviewer pour accéder aux fichiers publiés. | `apps/public` |
| `MVIEWERSTUDIO_URL_PATH_PREFIX` | Préfixe d’URL pour servir Studio sous un sous-chemin ; voir [#271](https://github.com/mviewer/mviewerstudio/pull/271). | `mviewerstudio` |

Les variables de session et d’authentification ainsi que le mapping des claims sont documentés dans le [guide Authentification](../docs/doc_tech/authentification.rst).

## Configuration par défaut

Le fichier Compose monte `apps` dans `/home/mvuser/apps`. Préparez manuellement `apps/store` et `apps/public` avec les identifiants choisis. Adaptez `src/static/config.json` à votre environnement ; ce fichier est monté dans le conteneur. Gunicorn et Flask servent également les fichiers du frontend.

## Communication sur le réseau Docker

Le chargement via `api/app/load` utilise une URL absolue. Une URL interne au réseau Docker permet au backend de récupérer les XML sans passer par le domaine public et son éventuel certificat autosigné.

Par exemple, si mviewer écoute sur le port interne `8080`, son adresse est `http://mviewer:8080/`, et un XML est accessible à :

```text
http://mviewer:8080/apps/store/my_org/<app-id>/<app-id>.xml
```

L'appel de chargement correspondant est :

```text
https://mywebsite.org/mviewerstudio/api/app/load?url=http%3A%2F%2Fmviewer%3A8080%2Fapps%2Fstore%2Fmy_org%2F<app-id>%2F<app-id>.xml
```

Exemple de configuration pour cet environnement :

```json
{
  "app_conf": {
    "mviewer_instance": "http://mviewer:8080/",
    "publish_url": "http://mviewer:8080/?config=apps/public/{{config}}.xml"
  }
}
```

`mviewer` est le nom du service Compose, résolu par le DNS interne de Docker. Adaptez le port à celui du service. Ces adresses servent à la communication entre conteneurs : elles ne sont pas accessibles depuis le navigateur de l'utilisateur. Conservez des URL publiques pour les liens utilisés par le frontend et séparez la configuration interne si nécessaire.

## Construire l'image

```bash
docker compose build mviewerstudio
```
