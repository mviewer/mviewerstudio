# mviewerstudio Dockerfile

## Which one ?
The maintained dockerfile if the python one. The php one is there for historical reasons and will probably soon be dropped.

## Environment variables

- EXPORT_CONF_FOLDER is the "staging" folder where studio will store draft configs and work in progress
- CONF_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_PUBLISH_PATH is the "production" folder where studio will copy the map files when you ask to *Publish*
- CONF_PUBLISH_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_URL_PATH_PREFIX allows to serve studio on a non-root path, see [#271](https://github.com/mviewer/mviewerstudio/pull/271)

## Default configuration

The default configuration (env vars defined in the dockerfile and json config file copied) assume that:
- the mviewer _apps_ folder is mounted at EXPORT_CONF_FOLDER=/home/apprunner/apps
- /home/apprunner/apps/store and /home/apprunner/apps/prod are existing folders (you might need to create them manually beforehand)
- it is using config-python-sample.json, which has some development settings (see path to mviewer). The current docker-compose.yml makes do with this config, but you will definitely want to override this config file when running on production.


It is also configured to serve the frontend (static files) with gunicorn, which is usually not recommended. Later versions might use an nginx container to serve the frontend.
