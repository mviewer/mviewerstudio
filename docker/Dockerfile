FROM python:3.11-slim

#install git & studio dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libxml2-dev \
        libxslt1-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -r -m mvuser

USER mvuser

ENV HOME=/home/mvuser
ENV PATH=$HOME/.local/bin:$PATH

RUN mkdir -p /home/mvuser/apps/store
RUN chown -R mvuser:mvuser /home/mvuser/apps

WORKDIR /home/mvuser

COPY --chown=mvuser:mvuser src ./src
COPY --chown=mvuser:mvuser install ./install
# We need to install the app so that the config is properly read (there might be something to fix on
# app-factory.py, calling app.config.from_object requires the package to be installed
RUN pip install --user -r install/requirements.txt && pip install --user ./src

VOLUME [ "/home/mvuser/apps" ]

ENV EXPORT_CONF_FOLDER=/home/mvuser/apps/store \
    CONF_PATH_FROM_MVIEWER=apps/store \
    MVIEWERSTUDIO_PUBLISH_PATH=/home/mvuser/apps/public \
    CONF_PUBLISH_PATH_FROM_MVIEWER=apps/public \
    DEFAULT_ORG=public \
    MVIEWERSTUDIO_URL_PATH_PREFIX=mviewerstudio

CMD ["gunicorn", "-w 1", "-b 0.0.0.0:8000", "src.app:app"]
