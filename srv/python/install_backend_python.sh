#!/bin/bash

# Install required packages

apt install libxslt1-dev libxml2-dev
pip install virtualenv

# FULL PATH - WILL CLONE REPO TO THIS LOCATION
# EX : /home/<user>/git
WORKING_PATH="$1"

# To use a specific branch - will use master if no set
BRANCH="$2"

MVIEWERSTUDIO_DIR="mviewerstudio"

# custom install path
if [ "${WORKING_PATH}" ]; then
    cd "${WORKING_PATH}"
    MVIEWERSTUDIO_DIR="${WORKING_PATH}/mviewerstudio"
else
    MVIEWERSTUDIO_DIR="$(pwd)/mviewerstudio"
fi

STATIC_DIR="${MVIEWERSTUDIO_DIR}/srv/python/mviewerstudio_backend/static"

# Clone repo and change branch if needed

if [ ! -d "${MVIEWERSTUDIO_DIR}" ]; then
    git clone https://github.com/jdev-org/mviewerstudio.git
    if [ "${BRANCH}" ]; then
        cd "${MVIEWERSTUDIO_DIR}"
        git checkout "${BRANCH}"
    fi
fi

# Copy front resources

mkdir -p "${MVIEWERSTUDIO_DIR}/srv/python/mviewerstudio_backend/static/apps"
cp -r "${MVIEWERSTUDIO_DIR}/css" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/img" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/js" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/lib" "${STATIC_DIR}"
cp -r "${MVIEWERSTUDIO_DIR}/index.html" "${STATIC_DIR}"

cp "${MVIEWERSTUDIO_DIR}/mviewerstudio.i18n.json" "${STATIC_DIR}/mviewerstudio.i18n.json"
cp "${MVIEWERSTUDIO_DIR}/config-python-sample.json" "${STATIC_DIR}/apps/config.json"

cd "${MVIEWERSTUDIO_DIR}/srv/python"

# install python venv and requirements

python3 -m venv .venv
. "${MVIEWERSTUDIO_DIR}/srv/python/.venv/bin/activate"
pip install -r requirements.txt -r dev-requirements.txt
pip install -e .

exit 0
