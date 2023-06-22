#!/bin/bash

# FULL PATH - WILL CLONE REPO TO THIS LOCATION
# EX : /home/<user>/git
WORKING_PATH="$1"

MVIEWERSTUDIO_DIR="mviewerstudio"


if [ "${WORKING_PATH}" ]; then
    cd "${WORKING_PATH}"
    MVIEWERSTUDIO_DIR="$1/mviewerstudio"
fi

STATIC_DIR="${MVIEWERSTUDIO_DIR}/srv/python/mviewerstudio_backend/static"


apt install libxslt1-dev libxml2-dev
pip install virtualenv

if [ ! -d "${MVIEWERSTUDIO_DIR}" ]; then
    git clone https://github.com/jdev-org/mviewerstudio.git
fi

mkdir -p "${MVIEWERSTUDIO_DIR}/srv/python/mviewerstudio_backend/static/apps"
cp -r "${MVIEWERSTUDIO_DIR}/css" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/img" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/js" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/lib" "${STATIC_DIR}"

cp "${MVIEWERSTUDIO_DIR}/mviewerstudio.i18n.json" "${STATIC_DIR}/mviewerstudio.i18n.json"
cp "${MVIEWERSTUDIO_DIR}/config-python-sample.json" "${STATIC_DIR}/apps/config.json"

cd "${MVIEWERSTUDIO_DIR}/srv/python"

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt -r dev-requirements.txt
pip install -e .