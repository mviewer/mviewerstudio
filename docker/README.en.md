# mviewerstudio Dockerfile

## Image
Only python Dockerfile will be maintained (PHP backend is fully deprecated).

## Manual Docker permissions

Run the commands below from the repository root. The container does not change
ownership or permissions automatically. Compose uses `MVIEWERSTUDIO_UID` and
`MVIEWERSTUDIO_GID` for both build arguments and runtime `user:` (default: `1000:1000`).

For an existing installation using `999:999`, add these lines to `.env`:

```dotenv
MVIEWERSTUDIO_UID=999
MVIEWERSTUDIO_GID=999
```

Prepare the host directories before starting the container, using your selected IDs:

```bash
sudo mkdir -p apps/store apps/public
sudo chown -R 999:999 apps/store apps/public
sudo chmod -R u+rwX apps/store apps/public
```

Adapt the host paths to the mounts for `EXPORT_CONF_FOLDER` and
`MVIEWERSTUDIO_PUBLISH_PATH`. Parent directories must allow traversal by this user.
Recursive commands affect existing files: preserve their owners if access already
works. Named volumes also need permissions matching the selected IDs.

For SFTP, check the account's actual IDs on the host:

```bash
id sftp_account
ls -ldn apps/store apps/public
```

The GID may differ from the UID. For chrooted SFTP, keep the chroot root directory
owned by root and not writable by the SFTP account. Apply data permissions only
to its data subdirectories.

### Build-time and runtime IDs

Build the image with custom default IDs:

```bash
docker build -f docker/Dockerfile --build-arg UID=999 --build-arg GID=999 -t mviewerstudio:local .
```

Override these IDs at runtime without rebuilding:

```bash
docker run --rm --user 1001:1002 -v "$PWD/apps:/home/mvuser/apps" mviewerstudio:local
```

Runtime `--user` or Compose `user:` takes precedence over the image default.
The `UID` and `GID` environment variables alone do not select the runtime user.
Prepare data permissions for the IDs actually used at runtime.

To download a published image and start it without building, set `.env` and run:

```bash
docker compose pull mviewerstudio
docker compose up -d --no-build --pull never --force-recreate mviewerstudio
```

The published image must include support for reading the application with a
custom UID. Once it does, changing IDs only requires recreating the container.

## Environment variables

- EXPORT_CONF_FOLDER is the "staging" folder where studio will store draft configs and work in progress
- CONF_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_PUBLISH_PATH is the "production" folder where studio will copy the map files when you ask to *Publish*
- CONF_PUBLISH_PATH_FROM_MVIEWER is the url path given to mviewer to access the same map files
- MVIEWERSTUDIO_URL_PATH_PREFIX allows to serve studio on a non-root path, see [#271](https://github.com/mviewer/mviewerstudio/pull/271)

## Default configuration

The default configuration (env vars defined in the dockerfile and json config file present in `src/static/config.json`) assume that:
- the host `apps` folder is mounted at `/home/mvuser/apps`
- `apps/store` and `apps/public` have been prepared manually for the configured UID and GID
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

## Build mviewerstudio image

Use docker compose to build image :

`docker compose build mviewerstudio`
