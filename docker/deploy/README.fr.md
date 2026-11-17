# Déploiement GitHub Actions vers un serveur SSH

Le workflow `.github/workflows/deploy.yml` télécharge l'image Docker Hub et teste les routes
`/mviewerstudio/` et `/mviewer/` sur les pull requests et les push sur `master`.
Sur `master`, il déploie ensuite si la variable de dépôt `DEPLOY_ENABLED` vaut
`true`. Le lancement manuel est également disponible depuis cette branche.
Les workflows existants restent inchangés.

L'image Studio provient de Docker Hub (`mviewer/mviewerstudio:latest` par défaut).
La CI résout son digest et le transmet au serveur par SSH : celui-ci télécharge
exactement la version validée, sans construction. Les artefacts GitHub sont
conservés trois jours. Le serveur doit être Linux **amd64**, comme le runner
de test, et disposer de Docker Engine,
Docker Compose v2 récent (options `--wait` et `--wait-timeout`), Bash, tar et flock.
Le compte SSH doit pouvoir exécuter Docker et écrire dans le dossier de déploiement.
Le serveur doit pouvoir télécharger les trois images depuis Docker Hub. Ce workflow utilise des images publiques.
Le code du dépôt n’est pas construit : publier la nouvelle image sur Docker Hub
avant de lancer le workflow pour déployer une évolution applicative.

## Préparer le serveur

Exemple avec le compte SSH `deploy`, le chemin `/opt/mviewerstudio` et l'utilisateur
applicatif `1000:1000`. Adapter les identifiants selon le [guide Docker](../README.fr.md).

```bash
sudo install -d -o deploy -g deploy /opt/mviewerstudio
sudo install -d -o 1000 -g 1000 /opt/mviewerstudio/apps/store /opt/mviewerstudio/apps/public
```

Copier la configuration frontend adaptée au serveur depuis `src/static/config.json`
vers `/opt/mviewerstudio/config.json` et la rendre lisible par l'UID applicatif.
Ce fichier est monté en lecture seule et n'est jamais écrasé par la CI.
Créer `/opt/mviewerstudio/.env` :

```dotenv
MVIEWERSTUDIO_UID=1000
MVIEWERSTUDIO_GID=1000
HTTP_PORT=80
```

Le script fixe les chemins de données et l'image ; ne pas les définir dans `.env`.
Pour reprendre une installation existante, déplacer/copier les données dans
`/opt/mviewerstudio/apps` et arrêter l'ancienne stack avant le premier déploiement
si elle utilise un autre nom de projet. Sauvegarder les données au préalable.
Le nom du projet déployé est `mviewerstudio`.

## Configurer GitHub

Créer l'environnement **production** dans Settings → Environments et y définir :

| Secret | Valeur |
| --- | --- |
| `DEPLOY_HOST` | Nom DNS ou IPv4 du serveur |
| `DEPLOY_USER` | Compte SSH, par exemple `deploy` |
| `DEPLOY_SSH_KEY` | Clé privée SSH dédiée, sans passphrase ; installer la clé publique dans `authorized_keys` |
| `DEPLOY_KNOWN_HOSTS` | Entrée known_hosts du serveur, empreinte vérifiée par un canal de confiance ; pour un port personnalisé utiliser `[hôte]:port` |

Créer les variables **de dépôt** suivantes dans Settings → Secrets and variables → Actions :

| Variable | Valeur |
| --- | --- |
| `DOCKERHUB_IMAGE` | Image Studio publique avec tag ou digest, par exemple `monorganisation/mviewerstudio:production` ; défaut `mviewer/mviewerstudio:latest` |
| `DEPLOY_ENABLED` | `true` une fois le serveur et les secrets prêts ; absent ou `false` laisse uniquement la CI active |
| `DEPLOY_PATH` | Facultatif, `/opt/mviewerstudio` par défaut ; chemin absolu sans espaces |
| `DEPLOY_PORT` | Facultatif, `22` par défaut |

L'accès SSH depuis les runners GitHub doit être possible. La vérification de la
clé du serveur est obligatoire. Des règles d'approbation peuvent être ajoutées
à l'environnement GitHub selon les besoins de l'équipe.

## Vérification et retour arrière

Chaque déploiement crée `releases/<commit>-<run>-<tentative>`. Le lien `current`
est mis à jour uniquement après succès des tests HTTP. Les exécutions de
production sont sérialisées, avec un verrou supplémentaire sur le serveur.
Les données et le fichier de configuration sont partagés entre les versions.

En cas d'échec, consulter les logs GitHub et `docker compose ... logs` sur le serveur.
Un échec après le redémarrage peut laisser la nouvelle version active : il n'y a
pas de retour arrière automatique et une courte interruption est possible.
Pour restaurer la dernière version validée, tant que son image Docker est conservée :

```bash
cd /opt/mviewerstudio/current
export MVIEWERSTUDIO_IMAGE="$(cat image.ref)"
export MVIEWERSTUDIO_PULL_POLICY=never
export MVIEWERSTUDIO_APPS_PATH=/opt/mviewerstudio/apps
export MVIEWERSTUDIO_CONFIG_PATH=/opt/mviewerstudio/config.json
docker compose -p mviewerstudio --env-file /opt/mviewerstudio/.env \
  -f docker-compose.yml -f docker/deploy/compose.yml \
  up -d --no-build --pull never --wait --wait-timeout 120
curl --fail http://localhost/mviewerstudio/
curl --fail http://localhost/mviewer/
```

Adapter le port des commandes curl si nécessaire. Les images et anciennes releases
ne sont pas supprimées automatiquement pour permettre ce retour arrière ; prévoir
leur nettoyage et les sauvegardes de `apps/`, `.env` et `config.json`.
Les images nginx et mviewer conservent les tags du Compose existant : elles sont
actualisées au déploiement et ne sont pas figées par commit. Le retour arrière
ci-dessus concerne donc l'image Studio et la configuration Compose/Nginx, pas les
données ni les versions de ces deux images tierces.

L'attente Compose contrôle l'état des conteneurs ; les tests HTTP vérifient ensuite
les routes applicatives ([documentation Docker](https://docs.docker.com/reference/cli/docker/compose/up/)).
Cela ne remplace pas des tests fonctionnels de création/publication de cartes.
