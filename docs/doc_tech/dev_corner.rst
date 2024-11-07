.. Authors : 
.. mviewer team

.. _dev_corner:

Coin du développeur
===================


Cette documentation permet de démarrer le backend Python avec VS Code (mode développement).

Cette documentation est à suivre si vous souhaitez développer avec Mviewerstudio ou bien le lancer sur votre ordinateur pour une analyse en pas à pas.


Prérequis
---------

- VS code
- Extensions VS Code python
- Avoir installé Mviewerstudio (e.g via le script `.sh`)
- Disposer des droits d'exécution en local (via Flask)
- Mviewer doit être installé et accessible en local (avec droit d'écriture)

Généralités
-----------

Le debugger VS Code permet d'utiliser le virtualenv (répertoire .venv) installé dans le répertoire `srv/python`.

Vous pouvez suivre cette documentation à propos des virtualenv dans VS code :

https://docs.posit.co/ide/server-pro/user/vs-code/guide/python-environments.html


Vous pouvez également consultez cette documentation sur le debugger Python dans VS code :

https://code.visualstudio.com/docs/python/tutorial-flask


Configuration du debugger VS Code
---------------------------------

1. Ouvrir le répertoire /srv/python/ dans VS Code.
2. Ouvrir le fichier .vscode/launch.json (voir la section suivante si non existant)
3. Modifier les variables d'environnement (aidez-vous de la page :ref:`install_python`) selon votre environnement

.. code-block:: sh

	"FLASK_APP": "mviewerstudio_backend/app.py",
	"FLASK_DEBUG": "1",
	"CONF_PATH_FROM_MVIEWER":"apps/store",
	"EXPORT_CONF_FOLDER":"/home/user/git/mviewer/apps/store/",
	"MVIEWERSTUDIO_PUBLISH_PATH":"/home/user/git/mviewer/apps/public",
	"CONF_PUBLISH_PATH_FROM_MVIEWER":"apps/public",
	"DEFAULT_ORG":"geobretagne",


4. Dans VS Code assurez-vous de sélectionner le bon virtualenv (voir les documentations précédentes)

5. Ouvrir le fichier `/srv/python/mviewerstudio_backend/static/apps/config.json` et adapter les bonnes valeurs

Ici, mviewer est accessible en local sur http://localhost:5051 (via NodeJs) et les répertoires `apps/store` et `apps/public` ont été créés à la main, et accessible en lecture / écriture par l'utilisateur qui exécute le backend via VS Code.

.. code-block:: sh

	"api": "api/app",
	"store_style_service": "api/style",
	"mviewer_instance": "http://localhost:5051/",
	"publish_url": "http://localhost:5051/?config=apps/public/{{config}}.xml",
	"conf_path_from_mviewer": "apps/store/",
	"mviewer_short_url": {
		"used": false,
		"apps_folder": "store",
		"public_folder": "public"
	},

6. Si les prérequis sont respectés et les configuration bien renseignées, vous pouvez démarrer le backend avec l'outil de debug VS Code (à gauche via le bouton `Run and Debug`).


Fichier launcher VS Code
------------------------

Si le fichier n'est pas disponible, vous pouvez le créer via le générateur VS Code ou bien à la main.

1. Création manuelle

Dans `/srv/python`, vous devrez créer un répertoire (si inexistant) `.vscode` et un fichier `launch.json`.

.. warning::
    Le type `python` semble déprécié mais fonctionne encore. Le type `debugpy` n'est pas compatible avec cette documentation.

Dans le fichier launch.json, collez ce fichier et reprenez la section `Configuration du debugger VS Code` précédente.

.. code-block:: sh

	{
		// Use IntelliSense to learn about possible attributes.
		// Hover to view descriptions of existing attributes.
		// For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
		"version": "0.2.0",
		"configurations": [
			{
				"name": "Python Debugger: Flask",
				"type": "python",
				"request": "launch",
				"module": "flask",
				"env": {
					"FLASK_APP": "mviewerstudio_backend/app.py",
					"FLASK_DEBUG": "1",
					"CONF_PATH_FROM_MVIEWER":"apps/store",
					"EXPORT_CONF_FOLDER":"/home/user/git/mviewer/apps/store/",
					"MVIEWERSTUDIO_PUBLISH_PATH":"/home/user/git/mviewer/apps/public",
					"CONF_PUBLISH_PATH_FROM_MVIEWER":"apps/public",
					"DEFAULT_ORG":"geobretagne",

				},
				"args": [
					"run",
					"--no-debugger",
					"--no-reload"
				],
				"jinja": true,
				"autoStartBrowser": false
			}
		]
	}

2. Création via l'outil VS Code

Ouvrez le répertoire srv/python dans VS Code.

- A gauche, cliquez sur `Run and Debug`.

- Dans l'interface, cliquez sur le lien dans la phrase `To customize Run and Debug create a launch.json file.`.

- Sélectionner le type `Python Debugger` dans la liste,

- Sélectionner le type `Flask` dans la seconde liste,

- Dans la 3è étape, cliquez sur `Default`

- Dans le nouveau fichier `.vscode/launch.json`, modifier les valeurs et surtout la valeur de "FLASK_APP" pour pointer vers le fichier `srv/python/mviewer_backend/app.py`

