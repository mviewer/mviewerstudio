# mviewerstudio Dockerfile

## Image
Only python Dockerfile will be maintained (PHP backend is fully deprecated).

## Environment variables

- EXPORT_CONF_FOLDER is the "staging" folder where studio will store draft configs and work in progress
- CONF_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_PUBLISH_PATH is the "production" folder where studio will copy the map files when you ask to *Publish*
- CONF_PUBLISH_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_URL_PATH_PREFIX allows to serve studio on a non-root path, see [#271](https://github.com/mviewer/mviewerstudio/pull/271)

## Default configuration

The default configuration (env vars defined in the dockerfile and json config file present in `src/static/config.json`) assume that:
- the mviewer _apps_ folder is mounted at EXPORT_CONF_FOLDER=/home/apprunner/apps
- /home/apprunner/apps/store and /home/apprunner/apps/prod are existing folders (you might need to create them manually beforehand)
- it is using `src/static/config.json`, which you will probably want to adapt to your own environment.


It is also configured to serve the frontend (static files) with gunicorn, which is usually not recommended. Later versions might use an nginx container to serve the frontend.

**Starting with version 4.3, the docker image assumes that the `EXPORT_CONF_FOLDER` directory is writeable for user 1000:1000.**

## Build mviewerstudio image

Use docker compose to build image :

`docker compose build mviewerstudio`

