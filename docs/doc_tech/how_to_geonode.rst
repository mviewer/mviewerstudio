.. Authors :
.. mviewer team

.. _how_to_geonode:

Configurer mviewerstudio pour l'authentification GeoNode OIDC/OAuth2
====================================================================

Cette documentation explique comment protéger mviewerstudio avec l'authentification OAuth2 / OIDC de GeoNode version 3.3.x. Cette documentation n'a pas été testée avec GeoNode v4 ou version supérieure.

Prérequis
---------

- avoir accès à la console d'administration (IHM) de GeoNode
- avoir un serveur GeoNode v3.x avec l'authentification OIDC/OAuth2 Django activée (non testé avec les versions supérieures)
- disposer de mviewerstudio version > 4.3.0
- avoir les droits de modification des fichiers python de Django
- disposer des bons certificats serveur

Si vous avez ces prérequis, vous pouvez suivre les étapes ci-dessous.

HTTPS
-----

Pour un déploiement normal de GeoNode et mviewerstudio, HTTPS doit être considéré comme obligatoire. En pratique :

- GeoNode est généralement exposé en HTTPS ;
- l'URL publique de mviewerstudio utilisée comme ``Redirect uri`` doit elle aussi être servie en HTTPS ;
- les URLs déclarées dans l'issuer, la redirection et la déconnexion doivent rester cohérentes entre elles.

Sans HTTPS, vous risquez des erreurs de redirection, des refus côté fournisseur d'identité ou une protection insuffisante des échanges.

Pour un environnement strictement local ou de test, HTTP peut parfois fonctionner selon la configuration de GeoNode et du navigateur, mais ce n'est pas recommandé pour une instance partagée ou exposée sur un réseau.

Ajouter une application dans Django OAuth Toolkit
-------------------------------------------------

L'objectif de cette étape est de créer dans GeoNode l'application OAuth2/OIDC utilisée par mviewerstudio, puis de récupérer son ``client_id`` et son ``client_secret``.

Via la console d'administration de GeoNode, ouvrez la section ``Django OAuth Toolkit`` puis ``Applications``.

Créez ensuite une nouvelle application avec les paramètres suivants :

1. ``Name`` : par exemple ``mviewerstudio``.
2. ``Client type`` : ``Confidential``.
3. ``Authorization grant type`` : ``Authorization code``.
4. ``Redirect uris`` : renseignez l'URL de retour de mviewerstudio, par exemple ``https://mon-instance.example.org/mviewerstudio/auth/callback``. Si mviewerstudio est servi derrière un préfixe différent, adaptez ce chemin. Le suffixe doit rester ``/auth/callback``.
5. ``Skip authorization`` : peut être activé si vous ne souhaitez pas afficher l'écran de consentement pour les utilisateurs déjà authentifiés.
6. ``Algorithm`` : sélectionner la bonne valeur (e.g RSA with SHA-2 256)

Enregistrez l'application. Après enregistrement, GeoNode affiche ou génère les identifiants du client OAuth2 :

- ``Client id`` : valeur à reporter dans ``MVIEWERSTUDIO_AUTHLIB_CLIENT_ID`` ;
- ``Client secret`` : valeur à reporter dans ``MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET``.

Conservez ces deux valeurs et vérifiez que l'URL de redirection déclarée correspond exactement à l'URL publique de mviewerstudio. Une différence de schéma, de domaine, de préfixe ou de slash final provoquera un échec du flux d'authentification.


Ajouter les claims dans GeoNode
-------------------------------

Il est possible le backend Django ne publie pas systématiquement les informations utiles à mviewerstudio dans l'id_token. Cette étape n'est donc nécessaire que si GeoNode ne transmet pas déjà les informations attendues par mviewerstudio, par exemple l'identifiant utilisateur, l'email, le nom, le prénom ou les groupes.

Préalablement, vous devrez donc prendre connaissance du fonctionnement via la documentation de django-oauth-toolkit utilisé par GeoNode : https://django-oauth-toolkit.readthedocs.io/en/latest/oidc.html

L'objectif est de rajouter des informations sur l'utilisateur, au sein de l'id token fourni.

Voici les étapes à suivre :

1. Dans le code Python de votre instance GeoNode, créez une fonction qui surcharge les claims OIDC retournés par django-oauth-toolkit.
   Cette fonction doit au minimum renvoyer les informations utilisées par mviewerstudio : ``sub``, ``email``, ``preferred_username`` ou ``username``, ``given_name``, ``family_name`` et un claim de groupes (e.g ``roles``).
2. Ajoutez dans ce claim de groupes les groupes GeoNode ou Django qui doivent être transmis à mviewerstudio.
   Un format liste est recommandé, par exemple ``groups = ["administrators", "editors"]``.
3. Déclarez cette fonction dans la configuration Django de GeoNode afin qu'elle soit utilisée lors de la génération de l'``id_token``.
   Avec django-oauth-toolkit, cette configuration se fait via le paramètre ``OIDC_EXTRA_SCOPE_CLAIMS`` ou via une fonction dédiée de génération de claims selon votre version de GeoNode.
4. Redémarrez GeoNode puis récupérez un nouveau token pour vérifier que le claim est bien présent.
   Vous devez retrouver les informations utilisateur et le claim de groupes dans l'``id_token`` ou dans la réponse ``userinfo``.
5. Reportez enfin le nom exact du claim de groupes dans ``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM`` côté mviewerstudio.
   Par exemple, si GeoNode publie ``groups``, utilisez ``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM=groups``.

Ci-dessous, voici un exemple de fichier ``oidc_validator.py`` testé avec GeoNode 3. La liste dans ``oidc_claim_scope`` est à adapter selon votre instance et vos besoins.

.. code-block:: python

	from oauth2_provider.oauth2_validators import OAuth2Validator

	def _safe_attr(obj, *names):
		for name in names:
			value = getattr(obj, name, None)
			if value:
				return value
		return None

	class GeoNodeOIDCValidator(OAuth2Validator):
		oidc_claim_scope = {
			"sub": "openid",
			"name": "profile",
			"family_name": "profile",
			"given_name": "profile",
			"preferred_username": "profile",
			"email": "email",
			"groups": "profile",
			"group_list_all": "profile",
			"organization": "profile",
		}

		def get_additional_claims(self, request):
			user = request.user
			full_name = user.get_full_name().strip() if hasattr(user, "get_full_name") else ""
			groups = list(user.groups.values_list("name", flat=True)) if hasattr(user, "groups") else []

			organization = _safe_attr(user, "organization", "organisation", "org")
			profile = _safe_attr(user, "profile")
			if not organization and profile is not None:
				organization = _safe_attr(profile, "organization", "organisation", "org", "company")

			return {
				"name": full_name or None,
				"given_name": _safe_attr(user, "first_name"),
				"family_name": _safe_attr(user, "last_name"),
				"preferred_username": _safe_attr(user, "username"),
				"email": _safe_attr(user, "email"),
				"groups": groups,
				"group_list_all": ",".join(groups),
				"organization": organization,
			}

Rajoutez ensuite ces lignes dans le ``settings.py`` de GeoNode pour utiliser votre validator. Remplacez ``mon_projet.oidc_validator.GeoNodeOIDCValidator`` par le chemin Python réel du fichier et de la classe dans votre instance.

.. code-block:: python

	# Change claims publish by OIDC provider
	OAUTH2_PROVIDER = dict(globals().get("OAUTH2_PROVIDER", {}))
	OAUTH2_PROVIDER["OAUTH2_VALIDATOR_CLASS"] = "mon_projet.oidc_validator.GeoNodeOIDCValidator"


Variables d'environnement
-------------------------

Pour ce type d'installation, vous devez utiliser les variables d'environnement :

- dans le fichier du service Gunicorn (/etc/systemd/system/mviewerstudio.service) sans Docker
- dans le fichier .env ou directement dans la configuration de la composition docker (voir plus bas)

les variables spécifiques à l'authentification OAuth2 sont :

- ``MVIEWERSTUDIO_AUTH_MODE=authlib`` : active le mode d'authentification OAuth2 / OIDC géré directement par mviewerstudio.
- ``MVIEWERSTUDIO_AUTHLIB_ISSUER`` : URL de l'issuer OIDC GeoNode. Cette valeur permet de retrouver automatiquement la configuration OIDC si ``MVIEWERSTUDIO_AUTHLIB_METADATA_URL`` n'est pas renseignée.
- ``MVIEWERSTUDIO_AUTHLIB_METADATA_URL`` : URL explicite du document de découverte OIDC (optionnelle si l'issuer suffit).
- ``MVIEWERSTUDIO_AUTHLIB_CLIENT_ID`` : identifiant du client OAuth2/OIDC déclaré dans GeoNode.
- ``MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET`` : secret associé à ce client OAuth2/OIDC.
- ``MVIEWERSTUDIO_AUTHLIB_SCOPE`` : scopes demandés pendant l'authentification. La valeur par défaut recommandée est ``openid profile email``.
- ``OIDC_END_SESSION_ENDPOINT`` : URL de déconnexion du fournisseur OIDC. Si elle n'est pas définie, mviewerstudio essaie d'utiliser l'endpoint exposé par la découverte OIDC.
- ``OIDC_POST_LOGOUT_REDIRECT_URI`` : URL publique de retour après déconnexion Authlib. Si elle est vide, Studio revient à sa racine avec son préfixe et HTTPS. Cette URL doit être autorisée par le fournisseur OIDC.
- ``MVIEWERSTUDIO_AUTHLIB_GROUPS_CLAIM`` : nom du claim, ou liste de claims séparés par des virgules, contenant les groupes ou rôles transmis par GeoNode.
- ``MVIEWERSTUDIO_AUTHLIB_ALLOWED_GROUPS`` : liste optionnelle des groupes autorisés à accéder à mviewerstudio, séparés par des virgules ou des points-virgules. Si cette variable est vide, tout utilisateur authentifié est accepté.
- ``MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL`` : URL de redirection optionnelle pour les utilisateurs anonymes dans les flux historiques.

Vérifiez la découverte OIDC avant de démarrer mviewerstudio. L'URL indiquée dans ``MVIEWERSTUDIO_AUTHLIB_ISSUER`` doit correspondre à l'``issuer`` publié par GeoNode. Vous pouvez aussi renseigner directement ``MVIEWERSTUDIO_AUTHLIB_METADATA_URL`` avec l'URL du document ``.well-known/openid-configuration``. Ce document doit notamment exposer les endpoints d'autorisation, de token et, si nécessaire, de ``userinfo`` et de déconnexion.

Exemple minimal :

.. code-block:: sh

   MVIEWERSTUDIO_AUTH_MODE=authlib
   MVIEWERSTUDIO_AUTHLIB_ISSUER=https://geonode.example.org/o
   MVIEWERSTUDIO_AUTHLIB_CLIENT_ID=mviewerstudio
   MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET=change-me
   MVIEWERSTUDIO_AUTHLIB_SCOPE=openid profile email

Configuration mviewerstudio sans docker compose
------------------------------------------------

L'installation est décrite dans la section suivante et ne sera pas reprise ici :

- https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html

La configuration est réalisée via le fichier du service Gunicorn (/etc/systemd/system/mviewerstudio.service).

Vous devrez modifier les variables pour correspondre à votre instance geonode.

Configuration mviewerstudio avec docker compose
-----------------------------------------------

Une section dédiée à l'installation via docker existe déjà dans la documentation :

- https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_docker.html

Cette section concerne les fichiers :

- fichier .env de votre composition docker
- fichier docker-compose.yml

 Voici un exemple de contenu de composition docker pour mviewerstudio :

.. code-block:: sh

	mviewerstudio:
		image: mviewer/mviewerstudio:latest
		environment:
		- LOG_LEVEL=INFO
		- REQUESTS_CA_BUNDLE=/etc/ssl/certs/mviewerstudio-ca-bundle.crt
		- SSL_CERT_FILE=/etc/ssl/certs/mviewerstudio-ca-bundle.crt
		- CONF_PATH_FROM_MVIEWER=apps/store
		- CONF_PUBLISH_PATH_FROM_MVIEWER=apps/public
		- DEFAULT_ORG=public
		- EXPORT_CONF_FOLDER=/home/mvuser/apps/store
		- MVIEWERSTUDIO_PUBLISH_PATH=/home/mvuser/apps/public
		- MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio
		- MVIEWERSTUDIO_PROXY_WHITE_LIST=cartes.gouv.fr,georisques.gouv.fr
		- MVIEWERSTUDIO_AUTH_MODE=authlib
		- MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio
		- MVIEWERSTUDIO_AUTHLIB_CLIENT_ID=id-value
		- MVIEWERSTUDIO_AUTHLIB_CLIENT_SECRET=secret-value
		- MVIEWERSTUDIO_AUTHLIB_ISSUER=https://mywebsite/issuer-url
		- MVIEWERSTUDIO_AUTHLIB_SCOPE=openid profile email
		- MVIEWERSTUDIO_AUTHLIB_ANONYMOUS_REDIRECT_URL=https://mywebsite/account/login/
		- OIDC_END_SESSION_ENDPOINT=https://mywebsite/account/logout/
		env_file:
		- .env
		volumes:
		- "/home/geonode/idg/cartes-mviewer/:/home/mvuser/apps"
		- "/home/geonode/idg/cartes-mviewer/config.json:/home/mvuser/src/static/config.json"
		- /home/geonode/idg/certs/mviewerstudio-ca-bundle.crt:/etc/ssl/certs/mviewerstudio-ca-bundle.crt:ro

Dans cet exemple, adaptez les chemins comme suit :

- ``/home/geonode/idg/certs/mviewerstudio-ca-bundle.crt`` est le chemin
  absolu du bundle présent sur l'hôte Docker. Remplacez-le par le chemin réel
  vers votre fichier de certificats ;
- ``/etc/ssl/certs/mviewerstudio-ca-bundle.crt`` est le chemin du même fichier
  une fois monté dans le conteneur. Ce chemin doit être identique dans
  ``SSL_CERT_FILE`` et ``REQUESTS_CA_BUNDLE`` ;
- la syntaxe du volume est donc
  ``chemin-sur-l-hote:chemin-dans-le-conteneur:ro``. L'option ``ro`` monte le
  fichier en lecture seule.

Le bundle doit contenir le certificat de l'autorité de certification qui a signé le certificat du serveur HTTPS appelé par mviewerstudio. Avec un certificat auto-signé, ajoutez directement ce certificat dans le bundle et installez-le aussi dans le magasin de confiance des autres clients concernés. Si le serveur utilise un certificat délivré par une autorité publique déjà connue du conteneur, ces deux variables et le volume personnalisé ne sont généralement pas nécessaires.

Vous pouvez passer toutes ces variables dans le fichier .env de votre composition. Il faut alors modifier les valeurs dans la configuration mviewerstudio de votre composition docker.

Voici un exemple avec `MVIEWERSTUDIO_AUTH_MODE`:

.. code-block:: sh

	  - MVIEWERSTUDIO_AUTH_MODE=authlib

... qui deviendra :

.. code-block:: sh

      - MVIEWERSTUDIO_AUTH_MODE=${MVIEWERSTUDIO_AUTH_MODE:-authlib}

Paramétrage du front mviewerstudio
----------------------------------

- fichier src/static/config.json

Le fichier de configuration est par défaut dans le répertoire du code source mviewerstudio :

- src/static/config.json

Vous devez le modifier afin de faire correspondre les paramètres et les URLs mviewer à votre instance ou votre mode de déploiement.

Avec Docker, notez que ce fichier et utilisé dans l'exemple précédent via un volume.



Certificats
-----------

Pour HTTPS, demandez à l'administrateur du serveur ou à la DSI le bundle PEM à utiliser. Il contient généralement le certificat serveur et les certificats intermédiaires. Un fichier ``fullchain.pem`` peut être utilisé directement.

Créer le fichier ``mviewerstudio-ca-bundle.crt`` ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Si vous ne disposez pas déjà d'un bundle fourni par la DSI, vous pouvez reconstruire un fichier PEM à partir du domaine HTTPS appelé par mviewerstudio.

1. Définissez le domaine cible puis récupérez directement la chaîne de certificats dans un bundle.

.. code-block:: sh

   DOMAIN=mon-domaine.example.org
   PORT=443
   openssl s_client -showcerts -connect ${DOMAIN}:${PORT} -servername ${DOMAIN} </dev/null \
     | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' \
     > mviewerstudio-ca-bundle.crt

2. Vérifiez combien de certificats ont été extraits dans le bundle.

.. code-block:: sh

   grep -c "BEGIN CERTIFICATE" mviewerstudio-ca-bundle.crt

3. Affichez les informations du premier certificat pour contrôler le sujet, l'émetteur et les dates de validité.

.. code-block:: sh

   openssl x509 -in mviewerstudio-ca-bundle.crt -noout -subject -issuer -dates

4. Vérifiez que le nom DNS attendu apparaît bien dans les noms alternatifs du certificat serveur.

.. code-block:: sh

   openssl x509 -in mviewerstudio-ca-bundle.crt -noout -text | grep -A1 "Subject Alternative Name"

Avec un certificat auto-signé, le bundle peut ne contenir qu'un seul certificat. Avec une chaîne plus classique, le bundle contient généralement le certificat serveur suivi des certificats intermédiaires.

Dans Docker, adaptez le volume suivant :

``chemin-sur-l-hote:chemin-dans-le-conteneur:ro``

Le chemin dans le conteneur doit être le même que celui indiqué dans ``SSL_CERT_FILE`` et ``REQUESTS_CA_BUNDLE``. Le chemin sur l'hôte doit pointer vers le bundle généré ou fourni pour votre instance.

Vérifiez aussi que le certificat contient le bon nom DNS dans le SAN, qu'il est valide et que sa chaîne est complète. Pour un certificat auto-signé, tous les clients concernés doivent faire confiance au certificat ou à l'autorité correspondante.
