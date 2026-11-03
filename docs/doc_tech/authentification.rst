.. Authors :
.. mviewer team

.. _authentification:

Authentification
########################

Cette page décrit la configuration de l'authentification du backend Python, indépendamment de son installation manuelle ou avec Docker. Les variables doivent être transmises au processus ou au conteneur qui exécute Studio.

Pour les principes du protocole, consultez :ref:`what_is_oauth2`. Pour une connexion directe à GeoNode, consultez :ref:`how_to_geonode`. Le guide :ref:`how_to_keycloak` détaille la configuration du client Keycloak et les exemples de déploiement.

Connexion directe à Keycloak avec Authlib
*************************************************

Avec ``MVIEWERSTUDIO_AUTH_MODE=authlib``, Studio gère directement la connexion OIDC à Keycloak, sans oauth2-proxy. Configurez ``MVIEWERSTUDIO_AUTHLIB_ISSUER`` (URL du realm), ``MVIEWERSTUDIO_AUTHLIB_CLIENT_ID``, ``MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET`` et une ``SECRET_KEY`` longue et stable. Les scopes par défaut sont ``openid profile email``. Une URL explicite de découverte peut être fournie via ``MVIEWERSTUDIO_AUTHLIB_METADATA_URL``.

Déclarez le callback public, par exemple ``https://studio.example.org/mviewerstudio/auth/callback``, dans les **Valid redirect URIs** du client Keycloak, avec **Client authentication** et **Standard flow** activés. Le préfixe dépend de ``MVIEWERSTUDIO_URL_PATH_PREFIX``.

Groupes et rôles
------------------------

En mode Authlib, ``MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS`` permet de filtrer les groupes ou rôles autorisés (virgules ou points-virgules). Sans liste, tout utilisateur authentifié est accepté. ``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM`` et ``MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING`` permettent d'adapter les claims reçus.

Déconnexion
-------------------

Pour la déconnexion, Studio utilise ``OIDC_END_SESSION_ENDPOINT`` s'il est renseigné, sinon l'endpoint découvert dans les métadonnées OIDC. Il efface ses jetons et claims locaux et redirige le navigateur vers Keycloak avec ``id_token_hint`` si disponible. ``OIDC_POST_LOGOUT_REDIRECT_URI`` définit la destination après déconnexion, par exemple ``https://keycloak.qualif-data.arnia-bfc.fr/mviewer/``. Autorisez exactement cette URL dans les **Valid Post Logout Redirect URIs** du client Keycloak. Si la variable est vide, la destination est la racine de Studio avec son préfixe et HTTPS. Sans endpoint de déconnexion, seule la session locale est effacée et le navigateur revient à Studio.

Le guide :ref:`how_to_keycloak` contient un exemple Compose et détaille la configuration de la déconnexion. Voir aussi la `documentation Keycloak sur la déconnexion <https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc-logout>`_.

Variables Authlib et sessions
*************************************

Les variables suivantes complètent la configuration décrite dans :ref:`how_to_keycloak` et :ref:`how_to_geonode`.

.. list-table::
   :header-rows: 1
   :widths: 40 60

   * - Variable
     - Utilisation
   * - ``SECRET_KEY``
     - Clé de signature des sessions, longue, aléatoire et stable ; ne doit pas être vide.
   * - ``MVIEWERSTUDIO_AUTHLIB_SCOPE``
     - Scopes demandés lors de la connexion ; défaut : ``openid profile email``.
   * - ``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM``
     - Nom de claim de premier niveau ou alias séparés par des virgules ; si vide, normalisation des claims standards, notamment ``roles``, ``realm_access.roles`` et ``groups``.
   * - ``MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING``
     - Objet JSON associant les champs utilisateur à des chemins dans les claims bruts ; défaut : ``{}``.
   * - ``MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL``
     - URL facultative de redirection des utilisateurs anonymes dans les parcours historiques ; ne définit pas le retour après déconnexion.
   * - ``SESSION_TYPE``
     - Backend de session Flask ; défaut : ``filesystem``.
   * - ``SESSION_FILE_DIR``
     - Dossier accessible en écriture pour les sessions filesystem ; défaut : ``/tmp/mviewerstudio-flask-session``.

Mapping des claims
--------------------------

.. code-block:: sh

    export MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING='{"organization":"organization[0]","roles":"realm_access.roles"}'

Avec ``organization: ["public", {"public": {}}]``, le chemin ``organization[0]`` donne ``public``. Si le claim est une chaîne, utilisez ``"organization":"organization"``. Les chemins acceptent les clés imbriquées (``profile.organization``), les indices de liste (``organization[0]``) et les clés entre crochets (``profile["organization"]``). Aucune expression Python n'est exécutée.

Champs configurables : ``preferred_username``, ``email``, ``name``, ``given_name``, ``family_name``, ``organization``, ``roles``, ``sub``. Les champs omis gardent leur normalisation habituelle. Un chemin absent donne ``null`` (ou ``[]`` pour les rôles) ; une organisation absente utilise ``DEFAULT_ORG``. Un mapping invalide provoque une erreur de configuration lors de la connexion. Redémarrez le service après modification et reconnectez-vous pour renouveler les claims en session.

Authentification par reverse-proxy
******************************************

``MVIEWERSTUDIO_AUTH_TYPE`` précise le type d'identité transmis par le proxy : ``georchestra`` (valeur par défaut), ``keycloak`` ou ``oidc``. La valeur ``keycloak`` sélectionne le mode proxy historique ; pour une connexion directe, définissez explicitement ``MVIEWERSTUDIO_AUTH_MODE=authlib``.

Avec ``MVIEWERSTUDIO_AUTH_MODE=proxy`` et ``MVIEWERSTUDIO_AUTH_TYPE=keycloak``, l'accès doit être protégé par oauth2-proxy configuré avec Keycloak. Studio attend les en-têtes transmis par le proxy, par exemple ``X-Auth-Request-Preferred-Username``, ``X-Auth-Request-Given-Name``, ``X-Auth-Request-Family-Name`` et ``X-Auth-Request-Groups``. Sans utilisateur authentifié transmis par le proxy, Studio renvoie ``401``. Dans ce mode, le filtrage des groupes et rôles doit être configuré dans oauth2-proxy.

``OAUTH2_PROXY_OIDC_ISSUER_URL`` et ``OAUTH2_PROXY_CLIENT_ID`` servent à construire la déconnexion du mode proxy historique ; ils ne remplacent pas les variables ``MVIEWERSTUDIO_AUTHLIB_*`` en mode Authlib. ``OIDC_END_SESSION_ENDPOINT`` et ``OIDC_POST_LOGOUT_REDIRECT_URI`` sont également utilisés par le mode proxy.

Avec ``MVIEWERSTUDIO_AUTH_MODE=proxy`` et ``MVIEWERSTUDIO_AUTH_TYPE=georchestra``, Studio lit les en-têtes ``sec-*`` fournis par geOrchestra Gateway ou par le security-proxy historique. Si des en-têtes d'identité OIDC contiennent aussi un identifiant utilisateur, l'adaptateur OIDC est prioritaire. Le guide :ref:`how_to_georchestra` détaille les en-têtes attendus, les règles d'accès et la configuration de ``logout_url`` pour terminer la session Gateway.
