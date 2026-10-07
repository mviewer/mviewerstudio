# Tests Python

## Installer l'environnement de test

Exécuter les commandes depuis la racine du dépôt, avec Python 3 et le module `venv` disponibles :

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r install/requirements.txt pytest
```

Si `.venv` existe déjà, conserver cet environnement et lancer uniquement la commande d'installation. `pytest` est également déclaré dans `install/dev-requirements.txt`, qui regroupe les autres outils de développement.

Les tests utilisent le client Flask intégré : aucun serveur Flask ni conteneur n'est nécessaire. Seuls les tests d'intégration de données nécessitent une connexion à Grist et une clé API.

## Exécuter les tests

Les suites disponibles sont :

| Fichier | Couverture | Accès à Grist |
| --- | --- | --- |
| `test_grist_proxy.py` | 8 tests du proxy : requêtes, authentification, erreurs réseau, redirections et CORS | Simulé, aucune clé nécessaire |
| `test_grist_data.py` | 2 tests d'envoi et de mise à jour de données | Réel, configuration locale nécessaire |
| `test.py` | 9 tests historiques d'authentification et de gestion des configurations XML | Aucun |

Lancer les tests du proxy et des données :

```bash
.venv/bin/python -B -m pytest src/tests/test_grist_proxy.py src/tests/test_grist_data.py -v -rs
```

L'option `-v` détaille les résultats et `-rs` affiche les raisons des tests ignorés (`SKIPPED`). Sans configuration Grist, les tests du proxy s'exécutent et les deux tests d'intégration sont ignorés. `PASSED` indique un succès ; `FAILED` ou `ERROR` indique un échec du scénario, de sa préparation ou de son nettoyage.

Pour collecter les 19 tests sans les exécuter :

```bash
.venv/bin/python -B -m pytest --collect-only -q src/tests/test.py src/tests/test_grist_proxy.py src/tests/test_grist_data.py
```

Le fichier `test.py` doit être fourni explicitement : son nom ne correspond pas aux motifs de découverte par défaut de pytest. Ces tests historiques utilisent encore les routes `/srv/...`, remplacées dans l'application par `/api/...` ; ils doivent être adaptés avant de servir de validation de l'application actuelle. Leurs fixtures suppriment `./store` : leur exécution doit se faire dans un répertoire de travail isolé, avec les chemins de stockage et de publication configurés pour ce répertoire.

## Envoi et mise à jour dans Grist

Dans `grist.local.json`, renseigner :

- `GRIST_API_URL` : URL de l'instance, sans le suffixe `/api`.
- `GRIST_DOCUMENT_ID` : identifiant d'un document dédié aux tests.
- `GRIST_API_KEY` : clé API disposant des droits de création, modification et suppression de tables dans ce document.

Si le fichier local est absent, le créer à partir de `grist.example.json` et limiter ses permissions à `600`. Le fichier local est ignoré par Git. Le modèle versionné doit toujours conserver une clé vide. Ne pas placer cette clé dans la configuration frontend.

Pour créer le fichier local sans remplacer une configuration existante :

```bash
(umask 077; cp -n src/tests/grist.example.json src/tests/grist.local.json)
chmod 600 src/tests/grist.local.json
git check-ignore src/tests/grist.local.json
```

Renseigner ensuite les valeurs dans un éditeur, en conservant un JSON valide. `git check-ignore` doit afficher le chemin du fichier local. La clé ne doit être ni versionnée, ni copiée dans une commande ou un journal.

Depuis la racine du projet :

```bash
.venv/bin/python -B -m pytest src/tests/test_grist_data.py -v -rs
```

Pour lancer un seul cas, ajouter `-k test_send_table` ou `-k test_update_table` à cette commande.

Les deux tests passent par le proxy Flask de l'application et contactent réellement Grist :

1. Créer une table et envoyer deux lignes ; relire leurs valeurs.
2. Créer une table, envoyer deux lignes et modifier la valeur d'une ligne ; vérifier les valeurs, les identifiants et le nombre de lignes.

Chaque test utilise une table unique `StudioIntegration_…`, supprimée automatiquement à la fin, même en cas d'échec. Une erreur de nettoyage fait échouer le test. Les tables préexistantes ne sont pas modifiées.

Sans configuration complète, les tests sont ignorés. Les journaux Python sont désactivés pendant les tests ; les erreurs HTTP affichent uniquement la méthode et le statut, jamais la clé, les en-têtes ou le corps de la réponse. Les erreurs attendues utilisent `pytest.fail(..., pytrace=False)` pour éviter d’exposer les données de réponse ou les identifiants dans les diagnostics. Les fixtures gèrent la configuration et le nettoyage.

En cas d'échec :

- `SKIPPED` : compléter les champs indiqués dans `grist.local.json`.
- Configuration illisible : vérifier le format JSON et l'accès au fichier.
- HTTP `401` ou `403` : vérifier la clé et ses droits sur le document de test.
- HTTP `404` : vérifier l'URL de l'instance et l'identifiant du document.
- HTTP `502` ou `504` : vérifier l'accès réseau à Grist et la disponibilité du service.
- Erreur de nettoyage : vérifier dans le document la présence d'une table `StudioIntegration_…` restante et supprimer uniquement cette table de test.

Ces tests vérifient les écritures via le proxy et l'API ; ils n'exécutent pas le parcours JavaScript du navigateur. Formats et actions : [documentation API Grist](https://support.getgrist.com/api/).
