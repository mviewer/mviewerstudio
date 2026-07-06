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

## Configuration : use docker network system

Use the Docker internal network to avoid two issues at the same time:

1. `mviewerstudio` requires an absolute URL for `api/app/load`.
2. Calling the public `https://mywebsite.org/...` URL from inside the container triggers TLS validation against a self-signed certificate.

By using the Docker service name directly, `mviewerstudio` can fetch the XML over the internal Compose network without going through the external HTTPS endpoint.

### Internal Docker URL

In this setup, the correct internal address is:
- http://mviewer:8080/

So the XML file should be fetched with a URL like:
- http://mviewer:8080/apps/store/my_org/<app-id>/<app-id>.xml

And the load endpoint can be called like this:
- https://mywebsite.org/mviewerstudio/api/app/load?url=http%3A%2F%2Fmviewer%3A8080%2Fapps%2Fstore%2Fmy_org%2F<app-id>%2F<app-id>.xml

### Configuration with network

To use this internal Docker route, update config_docker_network.json with the Docker service address:

```
{
  "app_conf": {
    "mviewer_instance": "http://mviewer:8080/",
    "publish_url": "http://mviewer:8080/?config=apps/public/{{config}}.xml"
  }
}
```

**Why this works ?**

- mviewer is the Docker Compose service name.
- Docker provides internal DNS resolution for service names on the same network.
- 8080 is the port used by mviewer in this environment.
- The request stays inside Docker and avoids the self-signed HTTPS certificate problem.

**Important note**

This configuration is appropriate for container-to-container communication.

If the same config file is also used by the browser UI, public links may point to http://mviewer:8080/..., which is not reachable from a user workstation.
In that case, keep a separate config for Docker-internal use and another one for public/browser-facing URLs.

## Change access on EXPORT_CONF_FOLDER

**Starting with version 4.3, the docker image assumes that the `EXPORT_CONF_FOLDER` directory is writeable for user 1000:1000.**

If `EXPORT_CONF_FOLDER` points to a directory mounted from the host, the practical command is:

```
sudo chown -R 1000:1000 /path/to/the/folder
```

And, if needed, also ensure write permissions:

```
sudo chmod -R u+rwX /path/to/the/folder
```

**Why this is needed ?**

Starting with version 4.3, the Docker image expects the `EXPORT_CONF_FOLDER` directory to be writable by user `1000:1000` inside the container.

**In this repository**

`EXPORT_CONF_FOLDER` is set to this path  (inside container) :

```
/home/mvuser/apps/store
```

inside the container, and the mounted parent directory is:

```
/home/mvuser/apps
```

In this repository, that is defined in `docker-compose.yml`.

## What to do depending on the volume type

- If you use a bind mount from the host, apply `chown` on the corresponding host directory.
- If you use the named Docker volume `mviewer-configs-xml`, Docker usually manages it and no manual permission change is required.

## Example with a host bind mount

If your host directory is:

```
/home/mviewer/cartes-mviewer
```

then run:

```
sudo mkdir -p /home/mviewer/cartes-mviewer/store
sudo chown -R 1000:1000 /home/mviewer/cartes-mviewer
sudo chmod -R u+rwX /home/mviewer/cartes-mviewer
```

This ensures that the container path `/home/mvuser/apps/store` is writable by the expected container user.
```

## Build mviewerstudio image

Use docker compose to build image :

`docker compose build mviewerstudio`
