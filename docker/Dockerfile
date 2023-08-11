# CREATE MVIEWERSTUDIO DOCKER IMAGE
# NEED MVIEWER + NGINX IMAGES TO WORKS TOGETHER !
# SEE DOCKER COMPOSE FILE

FROM debian:bullseye

RUN apt-get update
RUN apt-get -y install git libxslt1-dev libxml2-dev python3 python3-pip python3-venv
RUN pip install virtualenv
RUN useradd -r -m apprunner

USER apprunner

ENV HOME=/home/apprunner
ENV PATH=$HOME/.local/bin:$PATH

ENV EXPORT_CONF_FOLDER=/home/apprunner/apps/store
ENV MVIEWERSTUDIO_PUBLISH_PATH=/home/apprunner/apps/public

ENV CONF_PATH_FROM_MVIEWER=apps/store
ENV CONF_PUBLISH_PATH_FROM_MVIEWER=apps/public

ENV LOG_LEVEL=INFO

RUN mkdir -p /home/apprunner/apps/store
RUN mkdir -p /home/apprunner/apps/public
RUN chown -R apprunner:apprunner /home/apprunner/apps

WORKDIR /home/apprunner

COPY --chown=apprunner:apprunner srv/python .

COPY srv/python/requirements.txt /home/apprunner/requirements.txt
RUN pip install --user -r requirements.txt --no-cache-dir

COPY --chown=apprunner:apprunner srv/python .
RUN pip install --user . && pip install --user gunicorn --no-cache-dir

VOLUME [ "/home/apprunner/apps" ]

RUN mkdir -p /home/apprunner/mviewerstudio_backend/static/apps

COPY css /home/apprunner/mviewerstudio_backend/static/css
COPY js /home/apprunner/mviewerstudio_backend/static/js
COPY lib /home/apprunner/mviewerstudio_backend/static/lib
COPY img /home/apprunner/mviewerstudio_backend/static/img
COPY index.html /home/apprunner/mviewerstudio_backend/static/index.html
COPY mviewerstudio.i18n.json /home/apprunner/mviewerstudio_backend/static/mviewerstudio.i18n.json

COPY config-python-sample.json mviewerstudio_backend/static/apps/config.json

CMD ["gunicorn", "-w 4", "-b 0.0.0.0:8000", "mviewerstudio_backend.app:app"]
