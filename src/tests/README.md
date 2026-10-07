# Tests Python

## Envoi et mise à jour dans Grist

Dans `grist.local.json`, renseigner :

- `GRIST_API_URL` : URL de l'instance, sans le suffixe `/api`.
- `GRIST_DOCUMENT_ID` : identifiant d'un document dédié aux tests.
- `GRIST_API_KEY` : clé API disposant des droits de création, modification et suppression de tables dans ce document.

Si le fichier local est absent, le créer à partir de `grist.example.json` et limiter ses permissions à `600`. Le fichier local est ignoré par Git. Le modèle versionné doit toujours conserver une clé vide. Ne pas placer cette clé dans la configuration frontend.

Depuis la racine du projet :

```bash
.venv/bin/python -B -m pytest src/tests/test_grist_data.py -v
```

Les deux tests passent par le proxy Flask de l'application et contactent réellement Grist :

1. Créer une table et envoyer deux lignes ; relire leurs valeurs.
2. Créer une table, envoyer deux lignes et modifier la valeur d'une ligne ; vérifier les valeurs, les identifiants et le nombre de lignes.

Chaque test utilise une table unique `StudioIntegration_…`, supprimée automatiquement à la fin, même en cas d'échec. Une erreur de nettoyage fait échouer le test. Les tables préexistantes ne sont pas modifiées.

Sans configuration complète, les tests sont ignorés. Les journaux Python sont désactivés pendant les tests ; les erreurs HTTP affichent uniquement la méthode et le statut, jamais la clé, les en-têtes ou le corps de la réponse. Les erreurs attendues utilisent `pytest.fail(..., pytrace=False)` pour éviter d’exposer les données de réponse ou les identifiants dans les diagnostics. Les fixtures gèrent la configuration et le nettoyage.

Ces tests vérifient les écritures via le proxy et l'API ; ils n'exécutent pas le parcours JavaScript du navigateur. Formats et actions : [documentation API Grist](https://support.getgrist.com/api/).
