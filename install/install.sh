#!/bin/bash

set -euo pipefail

# ==========================================================================================
# Script name   : install.sh
# Author        : PSC mviewer
# Description   : Install mviewerstudio from the current checkout or by cloning the repo
# Usage         : ./install/install.sh [parent_directory] [branch] [directory_name]
# Documentation : https://mviewerstudio.readthedocs.io/fr/stable/doc_tech/install_python.html
# ==========================================================================================

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKING_PATH="${1:-}"
BRANCH="${2:-}"
TARGET_NAME="${3:-mviewerstudio}"
REPO_URL="https://github.com/mviewer/mviewerstudio.git"

install_system_packages() {
    if ! command -v apt >/dev/null 2>&1; then
        echo "Skipping system package installation: 'apt' not found."
        return
    fi

    local apt_runner="apt"
    if [ "${EUID}" -ne 0 ]; then
        if command -v sudo >/dev/null 2>&1; then
            apt_runner="sudo apt"
        else
            echo "Cannot install system packages automatically: run as root or install sudo."
            return
        fi
    fi

    echo "Installing required system packages..."
    ${apt_runner} install -y libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
}

resolve_project_dir() {
    if [ -z "${WORKING_PATH}" ]; then
        printf '%s\n' "${ROOT_DIR}"
        return
    fi

    mkdir -p "${WORKING_PATH}"
    printf '%s\n' "${WORKING_PATH%/}/${TARGET_NAME}"
}

clone_if_needed() {
    local project_dir="$1"

    if [ -z "${WORKING_PATH}" ]; then
        return
    fi

    if [ ! -d "${project_dir}/.git" ]; then
        echo "Cloning repository into ${project_dir}..."
        git clone "${REPO_URL}" "${project_dir}"
    fi

    if [ -n "${BRANCH}" ]; then
        echo "Checking out branch ${BRANCH}..."
        git -C "${project_dir}" checkout "${BRANCH}"
    fi
}

setup_front_config() {
    local project_dir="$1"
    local front_config="${project_dir}/src/static/config.json"

    if [ ! -f "${front_config}" ]; then
        echo "Missing front config: ${front_config}"
        exit 1
    fi
}

print_next_steps() {
    local project_dir="$1"

    cat <<EOF

Installation complete.

Project root: ${project_dir}

Next steps:

1. Review the front config file:
   ${project_dir}/src/static/config.json

2. Export the backend environment variables before starting the app:
   export CONF_PATH_FROM_MVIEWER=apps/store
   export EXPORT_CONF_FOLDER=${project_dir}/apps/store
   export MVIEWERSTUDIO_PUBLISH_PATH=${project_dir}/apps/public
   export CONF_PUBLISH_PATH_FROM_MVIEWER=apps/public
   export DEFAULT_ORG=public
   export LOG_LEVEL=INFO

3. Start the application:
   source "${project_dir}/.venv/bin/activate"
   flask --app "${project_dir}/src/app.py" run -p 5007

EOF
}

PROJECT_DIR="$(resolve_project_dir)"

install_system_packages
clone_if_needed "${PROJECT_DIR}"

echo "Project root: ${PROJECT_DIR}"
echo "Creating virtual environment..."
python3 -m venv "${PROJECT_DIR}/.venv"
. "${PROJECT_DIR}/.venv/bin/activate"

echo "Installing Python dependencies..."
pip install -r "${PROJECT_DIR}/install/requirements.txt" -r "${PROJECT_DIR}/install/dev-requirements.txt"
pip install -e "${PROJECT_DIR}/src"

setup_front_config "${PROJECT_DIR}"
print_next_steps "${PROJECT_DIR}"
