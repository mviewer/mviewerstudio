.. _configuration_proxy:

Configurer les proxys mviewerstudio
==================================

Cette page décrit :

- le proxy API Grist
- le proxy des services OGC 
- le proxy réseau sortant du backend
- les URL à configurer pour utiliser les couches exportées dans mviewer
- les réglages CORS (si les applications sont sur des origines différentes)

.. contents:: Sur cette page
   :local:
   :depth: 2

.. _proxy_grist:

Proxy API Grist
---------------

Le backend mviewerstudio expose ``/<préfixe>/grist/api/<chemin>`` et transmet les requêtes à l'instance définie par ``GRIST_API_URL``.

Le ``/<préfixe>`` correspond au chemin public de mviewerstudio, par exemple ``/mviewerstudio``.

Il est absent lorsque Flask est servi directement à la racine.

Configuration frontend du proxy Grist
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Dans ``src/static/config.json``, les paramètres sont placés dans ``app_conf.grist`` :

- ``app_config.grist.api_url`` : base utilisée par l'interface mviewerstudio pour appeler le proxy. La valeur relative ``grist`` utilise la même origine que mviewerstudio.
- ``app_config.grist.proxy`` : URL absolue de l'API du proxy utilisée dans les couches exportées vers mviewer. Elle inclut le suffixe ``/grist/api/``.
- ``app_config.grist.instance_url`` : adresse publique de Grist utilisée pour ouvrir ses documents.

Extrait pour un backend local sur le port 5000 :

.. code-block:: json

    {
      "app_conf": {
        "grist": {
          "api_url": "grist",
          "proxy": "http://localhost:5000/grist/api/",
          "instance_url": "https://grist.numerique.gouv.fr/"
        }
      }
    }

Ces valeurs complètent votre configuration existante. Au clic sur « Sélectionner », mviewerstudio construit l'URL CSV avec ``grist.proxy`` suivi de ``docs/{docId}/download/csv?tableId={tableId}``.

Le slash final du proxy est facultatif. Sans ``grist.proxy``, la base ``api_url`` (ou ``instance_url``) est résolue en URL absolue depuis la page mviewerstudio, puis complétée par ``/api``.

Pour une installation publiée sous ``https://sig.example.org/mviewerstudio/``, utilisez ``https://sig.example.org/mviewerstudio/grist/api/`` comme valeur de ``grist.proxy``. Une URL relative telle que ``grist/api/...`` serait résolue par mviewer sous son propre chemin, par exemple ``/mviewer/grist/api/...``. Après modification, rechargez mviewerstudio et recréez la couche ou corrigez son URL : les XML déjà enregistrés ne sont pas réécrits automatiquement.

Configuration backend et accès CORS
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

- ``GRIST_API_URL`` : instance distante appelée par Python (défaut : ``https://grist.numerique.gouv.fr``), sans suffixe ``/api``.
- ``GRIST_PROXY_TIMEOUT`` : délai d'attente réseau en secondes (défaut : ``20``).
- ``GRIST_CORS_ORIGINS`` : origines mviewer autorisées à lire le proxy, séparées par des virgules. Aucune origine externe n'est autorisée par défaut.

Une origine comprend le protocole, le domaine et le port éventuel, sans chemin ni slash final.

Exemples : 

- ``http://localhost:5051`` et ``http://localhost:5000`` sont deux origines différentes - configuration CORS nécessaire
- ``https://sig.example.org/mviewer/`` et ``https://sig.example.org/mviewerstudio/`` ont la même origine - aucune configuration CORS n'est nécessaire

Pour mviewer sur ``http://localhost:5051`` et Flask sur le port 5000 :

.. code-block:: sh

    export GRIST_CORS_ORIGINS=http://localhost:5051
    flask --app src.app:app run --port 5000

Avec le débogueur VS Code, ajoutez la variable dans ``env`` de ``.vscode/launch.json`` puis redémarrez le débogueur :

.. code-block:: json

    "GRIST_CORS_ORIGINS": "http://localhost:5051"

Avec Docker Compose, ajoutez ces entrées à la liste ``environment`` existante du service ``mviewerstudio``, puis recréez ce service :

.. code-block:: yaml

    - GRIST_API_URL=https://grist.numerique.gouv.fr
    - GRIST_PROXY_TIMEOUT=20
    - GRIST_CORS_ORIGINS=http://localhost:5051,https://cartes.example.org

Les réponses du proxy autorisent ``GET``, ``HEAD`` et les requêtes préliminaires ``OPTIONS`` pour les origines configurées, avec les en-têtes ``Authorization``, ``Content-Type`` et ``Accept``.

Les réponses d'erreur portent aussi les en-têtes CORS. Les écritures inter-origines et les cookies inter-origines ne sont pas activés.

Le proxy transmet les méthodes API, les paramètres, le corps et le jeton ``Authorization`` à Grist.

> Les cookies de session ne sont pas transmis : saisissez votre clé API manuellement à la première utilisation. Les redirections distantes sont refusées. La jointure géographique Python utilise aussi ``GRIST_API_URL`` directement.

Les requêtes sortantes utilisent ``HTTP_PROXY``, ``HTTPS_PROXY`` et ``NO_PROXY`` lorsqu'ils sont définis.

Vérifier une erreur CORS
~~~~~~~~~~~~~~~~~~~~~~~~

Si le navigateur signale l'absence de ``Access-Control-Allow-Origin``, vérifiez l'origine exacte de mviewer dans ``GRIST_CORS_ORIGINS`` et redémarrez Flask.

Cette requête côté serveur vérifie le précontrôle sans transmettre de clé API ni appeler l'instance Grist distante :

.. code-block:: sh

    curl -i -X OPTIONS \
      'http://localhost:5000/grist/api/docs/DOCUMENT/download/csv?tableId=TABLE' \
      -H 'Origin: http://localhost:5051' \
      -H 'Access-Control-Request-Method: GET' \
      -H 'Access-Control-Request-Headers: authorization'

La réponse doit contenir ``Access-Control-Allow-Origin: http://localhost:5051`` et autoriser l'en-tête ``Authorization``.

Attention :Si un reverse proxy est placé devant Flask, vérifiez qu'il laisse parvenir les requêtes ``OPTIONS`` à cette route.

Une réponse ``401`` ou ``403`` visible après correction CORS indique ensuite un problème d'authentification ou de droits à examiner côté Grist.

Proxy des services OGC
----------------------

Le proxy général de mviewerstudio expose ``/<préfixe>/proxy/?url=...`` pour les requêtes vers les services distants autorisés.

Sa configuration frontend utilise ``app_conf.proxy``, par exemple ``/mviewerstudio/proxy/?url=``.

La liste des serveurs autorisés est définie par la variable d'environnement ``MVIEWERSTUDIO_PROXY_WHITE_LIST``, lue dans ``src/settings.py`` sous le nom ``PROXY_WHITE_LIST``.

Indiquez les domaines séparés par des virgules, avec le port si l'URL distante en contient un :

.. code-block:: sh

    export MVIEWERSTUDIO_PROXY_WHITE_LIST=geobretagne.fr,ows.region-bretagne.fr

Cette liste concerne le proxy général ; le proxy Grist utilise sa propre cible ``GRIST_API_URL`` et ses origines ``GRIST_CORS_ORIGINS``.


Proxy réseau sortant du backend
-------------------------------

Si le serveur doit passer par un proxy réseau pour contacter les services distants, définissez les variables suivantes dans l'environnement du processus Python :

- ``HTTP_PROXY`` : URL du proxy pour les requêtes HTTP.
- ``HTTPS_PROXY`` : URL du proxy pour les requêtes HTTPS.
- ``NO_PROXY`` : hôtes ou domaines à contacter directement, séparés par des virgules.

.. code-block:: sh

    export HTTP_PROXY=http://proxy.example.org:3128
    export HTTPS_PROXY=http://proxy.example.org:3128
    export NO_PROXY=localhost,127.0.0.1,.example.org

Les appels ``requests`` du backend utilisent automatiquement ces variables, y compris ceux du proxy Grist. Les variantes minuscules ``http_proxy``, ``https_proxy`` et ``no_proxy`` sont également reconnues et prioritaires. Modifiez l'environnement du processus puis redémarrez le backend ; modifier uniquement les valeurs de configuration Flask ne change pas le proxy utilisé par Requests.

Pour publier mviewerstudio derrière Nginx ou Apache, consultez la section « Mise en production » de :doc:`install_python`.
