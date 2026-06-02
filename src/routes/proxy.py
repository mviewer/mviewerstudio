import requests
from flask import request
from flask.typing import ResponseReturnValue
from werkzeug.exceptions import BadRequest, MethodNotAllowed

from .shared import _is_allowed_proxy_origin, basic_store


@basic_store.route("/proxy/", methods=["GET", "POST"])
def proxy() -> ResponseReturnValue:
    url = request.args.get("url")
    if not url:
        raise BadRequest("Missing param : url")
    if not _is_allowed_proxy_origin(url):
        raise MethodNotAllowed("Not allowed !")

    if request.method == "GET":
        return requests.get(url).content
    if request.method == "POST":
        xml = request.stream.read()
        headers = {"Content-Type": "application/xml; charset=UTF-8"}
        return requests.post(url, data=xml, headers=headers).content
    raise MethodNotAllowed("Not allowed !")
