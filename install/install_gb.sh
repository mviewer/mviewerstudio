#!/bin/bash

set -euo pipefail

# ==========================================================================================
# Script name   : install_gb.sh
# Author        : Codex
# Description   : Install mviewerstudio from the current repository checkout
# Usage         : ./install/install_gb.sh
# ==========================================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV_DIR="${ROOT_DIR}/.venv"
FRONT_CONFIG="${ROOT_DIR}/src/static/apps/config.json"
FRONT_CONFIG_SAMPLE="${ROOT_DIR}/config-python-sample.json"

echo "Project root: ${ROOT_DIR}"

echo "Installing required system packages..."
sudo apt install -y libxslt1-dev libxml2-dev python3 python3-pip python3-venv git

echo "Creating virtual environment..."
python3 -m venv "${VENV_DIR}"
. "${VENV_DIR}/bin/activate"

echo "Installing Python dependencies..."
pip install -r "${ROOT_DIR}/install/requirements.txt" -r "${ROOT_DIR}/install/dev-requirements.txt"
pip install -e "${ROOT_DIR}/src"

if [ ! -f "${FRONT_CONFIG}" ]; then
    echo "Creating front config from sample..."
    cp "${FRONT_CONFIG_SAMPLE}" "${FRONT_CONFIG}"
fi

cat <<EOF

Installation complete.

Next steps:

1. Review the front config file:

   ${FRONT_CONFIG}

2. Export the backend environment variables before starting the app:
   export CONF_PATH_FROM_MVIEWER=apps/store
   export EXPORT_CONF_FOLDER=/path/to/mviewer/apps/store
   export MVIEWERSTUDIO_PUBLISH_PATH=/path/to/mviewer/apps/public
   export CONF_PUBLISH_PATH_FROM_MVIEWER=apps/public
   export DEFAULT_ORG=public
   export LOG_LEVEL=INFO
   export FLASK_APP=app:app

3. Start the application:
   source "${VENV_DIR}/bin/activate"
   flask run -p 5007

EOF
