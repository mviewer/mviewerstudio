#!/bin/bash

set -euo pipefail

#==========================================================================================
# Script name   : install_backend_python.sh
# Autor         : PSC mviewer
# Description   : This script ease mviewerstudio install
# Usage         : ./install_backend_python.sh [parent_directory] [branch] [directory_name]
# Documentation : https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html
#==========================================================================================

# Install required packages
apt install libxslt1-dev libxml2-dev python3 python3-pip python3-venv
pip install virtualenv

# FULL PATH - WILL CLONE REPO TO THIS LOCATION
# EX : /home/<user>/git
WORKING_PATH="$1"

# To use a specific branch
BRANCH="$2"

MVIEWERSTUDIO_DIR="$3"

# Adapt this repo URL to get source from your own Git space
REPO_URL="https://github.com/mviewer/mviewerstudio.git"

# use default mviewerstudio dir name if not set from param
if [ -z "${MVIEWERSTUDIO_DIR}" ]; then
    MVIEWERSTUDIO_DIR="mviewerstudio"
fi

# custom install path
if [ "${WORKING_PATH}" ]; then
    cd "${WORKING_PATH}"
    MVIEWERSTUDIO_DIR="${WORKING_PATH}/${MVIEWERSTUDIO_DIR}"
else
    MVIEWERSTUDIO_DIR="$(pwd)/${MVIEWERSTUDIO_DIR}"
fi

# Clone repo and change branch if needed

if [ ! -d "${MVIEWERSTUDIO_DIR}" ]; then
    git clone "${REPO_URL}" "${MVIEWERSTUDIO_DIR}"
    if [ "${BRANCH}" ]; then
        cd "${MVIEWERSTUDIO_DIR}"
        git checkout "${BRANCH}"
    fi
fi

# install python venv and requirements

python3 -m venv "${MVIEWERSTUDIO_DIR}/.venv"
. "${MVIEWERSTUDIO_DIR}/.venv/bin/activate"
pip install -r "${MVIEWERSTUDIO_DIR}/install/requirements.txt" -r "${MVIEWERSTUDIO_DIR}/install/dev-requirements.txt"
pip install -e "${MVIEWERSTUDIO_DIR}/src"
