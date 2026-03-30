#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
INSTALL_SCRIPT="${ROOT_DIR}/install/install_gb.sh"
FRONT_CONFIG="${ROOT_DIR}/src/static/apps/config.json"

needs_install=false

if [ ! -x "${INSTALL_SCRIPT}" ]; then
    echo "Install script not found or not executable: ${INSTALL_SCRIPT}"
    exit 1
fi

if [ ! -d "${VENV_DIR}" ]; then
    needs_install=true
fi

if [ ! -f "${FRONT_CONFIG}" ]; then
    needs_install=true
fi

if [ "${needs_install}" = true ]; then
    echo "Environment not ready. Running install/install_gb.sh..."
    "${INSTALL_SCRIPT}"
fi

. "${VENV_DIR}/bin/activate"

if ! command -v flask >/dev/null 2>&1; then
    echo "Flask not available in the current virtualenv. Running install/install_gb.sh..."
    "${INSTALL_SCRIPT}"
    . "${VENV_DIR}/bin/activate"
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
