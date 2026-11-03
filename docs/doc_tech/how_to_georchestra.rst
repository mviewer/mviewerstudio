.. Authors :
.. mviewer team

.. _how_to_georchestra:

Configurer mviewerstudio avec geOrchestra Gateway
########################################################

Studio peut utiliser l'identité transmise par geOrchestra Gateway ou par le security-proxy historique. La Gateway gère la connexion et le contrôle d'accès ; Studio lit les en-têtes fournis par ce proxy. Pour les autres modes, consultez :ref:`authentification`.

Configurer Studio
*************************

**Les variables ``MVIEWERSTUDIO_AUTHLIB_*`` ne sont pas nécessaires lorsque la connexion est prise en charge par la Gateway, même si celle-ci utilise Keycloak en amont.**

Transmettez ces variables au backend, par exemple dans le service Docker Compose ``mviewerstudio`` :

.. code-block:: yaml

    environment:
      - MVIEWERSTUDIO_AUTH_MODE=proxy
      - MVIEWERSTUDIO_AUTH_TYPE=georchestra
      - MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio

``MVIEWERSTUDIO_AUTH_MODE=gateway`` est également accepté comme alias de ``proxy``. 

Configurer la Gateway
****************************

Déclarez le routage vers le backend Studio pour le préfixe public choisi et configurez les règles d'accès ainsi que la transmission des informations utilisateur dans la Gateway.

Le backend doit recevoir les en-têtes suivants :

.. list-table::
   :header-rows: 1
   :widths: 35 65

   * - En-tête
     - Champ Studio
   * - ``sec-username``
     - Identifiant utilisateur ; nécessaire pour reconnaître un utilisateur authentifié.
   * - ``sec-firstname``
     - Prénom.
   * - ``sec-lastname``
     - Nom.
   * - ``sec-org``
     - Organisation ; à défaut, Studio utilise ``DEFAULT_ORG``.
   * - ``sec-roles``
     - Rôles séparés par des points-virgules, par exemple ``ROLE_USER;ROLE_SUPERUSER``.

Les en-têtes d'identité OIDC ``X-Forwarded-*``, ``X-Auth-Request-*`` ou ``Remote-User`` ont priorité lorsqu'ils contiennent un identifiant utilisateur. En leur absence, Studio utilise les en-têtes geOrchestra ``sec-*``. Les données de ces deux adaptateurs ne sont pas fusionnées.

**``MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS`` concerne uniquement le mode Authlib (OAuth2/OIDC)**.

Sans identité authentifiée, une API protégée renvoie ``401``. Le filtrage des accès par rôle doit être défini dans la Gateway ; 
Faites passer les accès au backend par la Gateway et laissez celle-ci produire les en-têtes d'identité de confiance.

Configurer la déconnexion
********************************

Dans ``src/static/config.json``, renseignez ``logout_url`` avec l'URL publique de déconnexion de votre Gateway. Cette propriété doit être placée dans l'objet ``app_conf`` de la configuration du frontend. Reprenez l'URL et les éventuels paramètres de retour de votre déploiement geOrchestra.

Le menu utilisateur utilise cette URL lorsqu'elle est renseignée. Sinon, il appelle la route relative ``logout`` de Studio, dont le mode proxy construit une déconnexion oauth2-proxy.

Ce comportement ne termine pas automatiquement une session geOrchestra Gateway.

**Rappel : Les variables ``OAUTH2_PROXY_*`` ne configurent pas la déconnexion de la Gateway.**

Consultez :ref:`config_front` pour les paramètres du frontend. Après modification des variables du backend, redémarrez le service ou recréez le conteneur, puis rechargez le frontend après modification de sa configuration.

Vérifier l'intégration
*****************************

- Connectez-vous à travers la Gateway, puis ouvrez Studio sous son préfixe public.
- Vérifiez que ``/mviewerstudio/api/user`` renvoie ``200``, ``auth_mode=proxy``, l'identifiant, les noms, l'organisation et les rôles attendus.
- Vérifiez qu'un compte sans les rôles autorisés est bloqué par les règles de la Gateway.
- Utilisez le menu de déconnexion et vérifiez la fin de session côté Gateway ainsi que le retour configuré.

Références
******************

- `Guide utilisateur geOrchestra Gateway <https://docs.georchestra.org/gateway/en/latest/user_guide/>`_
- `En-têtes utilisateur transmis par la Gateway <https://docs.georchestra.org/superset/en/latest/technical_guides/contribute/dev_setup/>`_
