.. Authors :
.. mviewer team

.. _how_to_keycloak:

Configurer mviewerstudio avec Keycloak
############################################

Ce guide décrit la connexion OIDC directe à Keycloak avec Authlib, sans oauth2-proxy. Pour comparer ce fonctionnement avec l'authentification par reverse-proxy, consultez :ref:`authentification`.

Prérequis
*****************

- Un realm Keycloak accessible depuis le navigateur et le conteneur ou processus Studio.
- Une URL publique HTTPS pour Studio et un reverse-proxy transmettant le domaine et le protocole publics.
- Un client OpenID Connect dédié à Studio, avec son identifiant et son secret.

Les exemples utilisent ``https://sso.example.org/realms/mon-realm`` comme issuer et ``https://studio.example.org/mviewerstudio/`` comme URL publique de Studio. Adaptez les domaines, le realm et le préfixe à votre installation.

Configurer le client Keycloak
************************************

Dans le realm choisi, créez un client OpenID Connect et configurez les paramètres suivants :

- **Client ID** : ``mviewerstudio``, ou l'identifiant de votre choix.
- **Client authentication** : activé, afin d'utiliser un secret côté backend.
- **Standard flow** : activé pour la connexion par code d'autorisation.
- **Valid redirect URIs** : ``https://studio.example.org/mviewerstudio/auth/callback``.
- **Valid Post Logout Redirect URIs** : l'URL de destination après déconnexion, par exemple ``https://studio.example.org/mviewer/``.

Récupérez le secret du client dans Keycloak pour renseigner ``MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET``. Le callback de connexion et l'URL de retour après déconnexion ont des fonctions différentes et doivent être déclarés dans leurs listes respectives.

Configurer Studio
*************************

Transmettez les variables suivantes au backend :

.. code-block:: sh

    export MVIEWERSTUDIO_AUTH_MODE=authlib
    export MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio
    export MVIEWERSTUDIO_AUTHLIB_ISSUER=https://sso.example.org/realms/mon-realm
    export MVIEWERSTUDIO_AUTHLIB_CLIENT_ID=mviewerstudio
    export MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET=remplacer-par-le-secret-du-client
    export MVIEWERSTUDIO_AUTHLIB_SCOPE="openid profile email"
    export OIDC_POST_LOGOUT_REDIRECT_URI=https://studio.example.org/mviewer/
    export SECRET_KEY=remplacer-par-une-cle-aleatoire-longue-et-stable

``MVIEWERSTUDIO_AUTH_MODE=authlib`` sélectionne explicitement la connexion directe. ``MVIEWERSTUDIO_AUTH_TYPE=keycloak`` correspond au mode proxy historique et ne doit pas remplacer ce réglage.

L'issuer est l'URL du realm, sans le suffixe de l'endpoint d'autorisation ou de déconnexion. Studio en déduit ``<issuer>/.well-known/openid-configuration``. Si nécessaire, ``MVIEWERSTUDIO_AUTHLIB_METADATA_URL`` permet de définir explicitement l'URL du document de découverte.

La clé ``SECRET_KEY`` signe les sessions et doit rester stable entre les redémarrages. Les chemins de stockage, de publication et ``DEFAULT_ORG`` sont à configurer séparément selon votre déploiement.

Exemple Docker Compose
==============================

Ajoutez ce bloc au service ``mviewerstudio``, en complément des volumes et des chemins de stockage :

.. code-block:: yaml

    environment:
      - MVIEWERSTUDIO_AUTH_MODE=authlib
      - MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio
      - MVIEWERSTUDIO_AUTHLIB_ISSUER=${MVIEWERSTUDIO_AUTHLIB_ISSUER:?Issuer OIDC requis}
      - MVIEWERSTUDIO_AUTHLIB_CLIENT_ID=${MVIEWERSTUDIO_AUTHLIB_CLIENT_ID:?Client ID requis}
      - MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET=${MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET:?Secret client requis}
      - MVIEWERSTUDIO_AUTHLIB_SCOPE=openid profile email
      - MVIEWERSTUDIO_AUTHLIB_METADATA_URL=${MVIEWERSTUDIO_AUTHLIB_METADATA_URL:-}
      - MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM=${MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM:-}
      - MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS=${MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS:-}
      - MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING=${MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING:-{}}
      - OIDC_END_SESSION_ENDPOINT=${OIDC_END_SESSION_ENDPOINT:-}
      - OIDC_POST_LOGOUT_REDIRECT_URI=${OIDC_POST_LOGOUT_REDIRECT_URI:-}
      - SECRET_KEY=${SECRET_KEY:?Cle de session requise}

Le fichier ``.env`` sert à l'interpolation Compose ; les variables doivent aussi être transmises au conteneur avec ``environment:`` ou ``env_file:``. Recréez le conteneur après modification. L'image doit contenir la prise en charge de ``OIDC_POST_LOGOUT_REDIRECT_URI`` en mode Authlib.

Groupes, rôles et organisation
*************************************

Par défaut, tout utilisateur authentifié peut accéder à Studio. Pour restreindre cet accès, exposez les groupes ou rôles nécessaires dans les claims retournés à Studio, puis renseignez ``MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS`` :

.. code-block:: sh

    export MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM=groups
    export MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS="MVIEWER_ADMIN,MVIEWER_EDITOR"

Les valeurs autorisées sont séparées par des virgules ou des points-virgules. Au moins une valeur doit correspondre exactement à un groupe ou rôle reçu. Si Keycloak émet des chemins de groupes tels que ``/MVIEWER_EDITOR``, utilisez ces mêmes valeurs dans la liste autorisée.

``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM`` désigne un claim de premier niveau. Pour un chemin imbriqué ou une organisation personnalisée, utilisez un mapping JSON :

.. code-block:: sh

    export MVIEWERSTUDIO_AUTHLIB_CLAIMS_MAPPING='{"roles":"realm_access.roles","organization":"organization"}'

Adaptez ce mapping aux claims réellement émis par votre client Keycloak. Sans organisation dans les claims, Studio utilise ``DEFAULT_ORG``. Reconnectez-vous après modification pour renouveler les claims de la session.

Connexion et déconnexion
********************************

Un visiteur non connecté qui ouvre Studio est dirigé vers ``/mviewerstudio/auth/login``, puis vers Keycloak. Après connexion, Keycloak revient sur ``/mviewerstudio/auth/callback`` et Studio ouvre la page demandée. Les API renvoient un statut ``401`` avec ``login_url`` lorsque la session n'est pas authentifiée.

Le menu de déconnexion appelle ``/mviewerstudio/logout`` ; ``/mviewerstudio/api/logout`` est également disponible. Studio construit l'URL de déconnexion du fournisseur, efface ses jetons et claims locaux, puis redirige le navigateur vers Keycloak.

- ``OIDC_END_SESSION_ENDPOINT`` remplace l'endpoint de déconnexion du fournisseur. Si vide, Studio utilise ``end_session_endpoint`` dans la découverte OIDC, normalement ``<issuer>/protocol/openid-connect/logout`` avec Keycloak.
- ``OIDC_POST_LOGOUT_REDIRECT_URI`` définit la destination publique après déconnexion. Si vide, Studio utilise sa propre racine avec le préfixe et HTTPS.

Pour revenir à mviewer dans l'environnement ARNIA, configurez ``OIDC_POST_LOGOUT_REDIRECT_URI=https://keycloak.qualif-data.arnia-bfc.fr/mviewer/`` et ajoutez exactement cette URL, barre finale comprise, aux **Valid Post Logout Redirect URIs** du client Keycloak.

Studio transmet ``id_token_hint`` lorsqu'un jeton d'identité est disponible. Si aucun endpoint de déconnexion n'est configuré ou découvert, Studio efface uniquement sa session locale et revient à sa racine ; la session Keycloak reste active.

Vérifier la configuration
********************************

- Ouvrez Studio sans session : le navigateur doit passer par Keycloak puis revenir au callback public.
- Vérifiez que ``/mviewerstudio/api/user`` renvoie l'utilisateur attendu avec ``auth_mode`` égal à ``authlib``.
- Si une liste de groupes est configurée, vérifiez l'accès avec un compte autorisé et un compte sans groupe autorisé ; ce dernier doit recevoir un refus ``403``.
- Déconnectez-vous : vérifiez le passage par l'endpoint Keycloak puis le retour à l'URL configurée.

Une erreur de callback nécessite de vérifier le domaine public, le protocole HTTPS et le préfixe déclarés dans Keycloak. Un refus de retour après déconnexion nécessite de comparer ``OIDC_POST_LOGOUT_REDIRECT_URI`` avec les **Valid Post Logout Redirect URIs**. Si la découverte échoue, vérifiez l'issuer ainsi que la connectivité et la confiance du certificat depuis le backend.

Références
******************

- :ref:`authentification`
- :ref:`what_is_oauth2`
- `Guide Docker en français <https://github.com/mviewer/mviewerstudio/blob/master/docker/README.fr.md>`_
- `Documentation Keycloak sur la déconnexion <https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc-logout>`_
