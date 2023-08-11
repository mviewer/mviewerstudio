# DOCKER

This directory concern mviewerstudio image with docker.
This simple page will be usefull to understant how to test developements with docker image.

## PREREQUISITES

- docker is available (see [how to install docker ?](https://docs.docker.com/engine/install/debian/) is necessary)
- user right to execute docker commands
- mviewerstudio clone :

```git clone https://github.com/mviewer/mviewerstudio.git```

## DOCKER COMMANDS

### How to build image ?

```
docker build . -t studiobackend -f docker/Dockerfile --no-cache --progress=plain
```

### How to run container ?

```
docker run --env-file docker/env.list -it --name studiobackendcontainer -p 8000:8000 studiobackend
```

Mviewerstudio is now available : [localhost:8000](http://localhost:8000)

### How to change configuration ?

If you don'tu use the volume, just change config-python-sample.json file and create image again.
Else, configuration will be available in volume directory (not tested yet).

### How to change configuration ?

By default, the docker run command use `docker/env.list` file. Adapt it to change ENV vars use by gunicorn.

# Features : todo

- test volumes access (need to see logs, access config without image rebuild)
- test if env variables could be externalized with across the apps volume (or dedicated volume)
- fix docker compose to produce full mviewerstudio stack
