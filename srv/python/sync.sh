#!/bin/bash

# =====================
# THIS SCRIPT EASE SYNC BETWEEN ROOT FOLDER AND PYTHON'S SRV DIRECTORY.
# USE ONE PARAM : action
# VALUE: pull or push
# 
# EXAMPLE TO SYNC AFTER GIT PULL:
# sh ./sync.sh pull
# 
# EXAMPLE TO SYNC BEFORE GIT PUSH:
# sh ./sync.sh push
# =====================

echo "START...."

if [ -z "$1" ]
then
        echo "No action param | First arg value 'push' or 'pull' missing"
        echo "Exemple : echo sh ./sync.sh pull /home/user/git/mviewerstudio"
        echo "....END."
        exit 0
fi

if [ -z "$2" ]
then
        echo "No root path param | second arg missing"
        echo "Exemple : echo sh ./sync.sh pull /home/user/git/mviewerstudio"
        echo "....END."
        exit 0
fi

root_path="$2"
srv_path="${root_path}/srv/python/"
srv_static_path="${srv_path}/mviewerstudio_backend/static"
action="$1"

if [ "${action}" = "pull" ]
then
	src="${root_path}"
	target="${srv_static_path}"
elif [ "${action}" = "push" ]
then
        src="${srv_static_path}"
        target="${root_path}"
fi

echo "Copy files...."
cp -pr "${src}/index.html" "${target}/index.html"
cp -pr "${src}/lib" "${target}"
cp -pr "${src}/js" "${target}"
cp -pr "${src}/css/mviewerstudio.css" "${target}/css/mviewerstudio.css"
cp -pr "${src}/mviewerstudio.i18n.json" "${target}/mviewerstudio.i18n.json"

echo "....END."
exit 0



