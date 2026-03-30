#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
FRONT_CONFIG="${ROOT_DIR}/src/static/apps/config.json"
FRONT_CONFIG_SAMPLE="${ROOT_DIR}/config-python-sample.json"

needs_install=false

if [ ! -d "${VENV_DIR}" ]; then
    needs_install=true
fi

if [ ! -f "${FRONT_CONFIG}" ]; then
    needs_install=true
fi

if [ "${needs_install}" = true ]; then
    echo "Environment not ready. Installing local dependencies..."
    sudo apt install -y libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
    python3 -m venv "${VENV_DIR}"
    . "${VENV_DIR}/bin/activate"
    pip install -r "${ROOT_DIR}/install/requirements.txt" -r "${ROOT_DIR}/install/dev-requirements.txt"
    pip install -e "${ROOT_DIR}/src"
    if [ ! -f "${FRONT_CONFIG}" ]; then
        cp "${FRONT_CONFIG_SAMPLE}" "${FRONT_CONFIG}"
    fi
else
    . "${VENV_DIR}/bin/activate"
fi

if ! command -v flask >/dev/null 2>&1; then
    echo "Flask not available in the current virtualenv. Reinstalling local dependencies..."
    pip install -r "${ROOT_DIR}/install/requirements.txt" -r "${ROOT_DIR}/install/dev-requirements.txt"
    pip install -e "${ROOT_DIR}/src"
fi

export CONF_PATH_FROM_MVIEWER="${CONF_PATH_FROM_MVIEWER:-apps/store}"
export CONF_PUBLISH_PATH_FROM_MVIEWER="${CONF_PUBLISH_PATH_FROM_MVIEWER:-apps/public}"
export EXPORT_CONF_FOLDER="${EXPORT_CONF_FOLDER:-${ROOT_DIR}/apps/store}"
export MVIEWERSTUDIO_PUBLISH_PATH="${MVIEWERSTUDIO_PUBLISH_PATH:-${ROOT_DIR}/apps/public}"
export DEFAULT_ORG="${DEFAULT_ORG:-public}"
export LOG_LEVEL="${LOG_LEVEL:-INFO}"
export FLASK_DEBUG="${FLASK_DEBUG:-1}"

mkdir -p "${EXPORT_CONF_FOLDER}" "${MVIEWERSTUDIO_PUBLISH_PATH}"

exec flask --app "${ROOT_DIR}/src/app.py" run -p "${FLASK_PORT:-5007}"
