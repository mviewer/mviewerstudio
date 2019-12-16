from flask import Response, jsonify
from typing import Tuple
from werkzeug.exceptions import HTTPException
import json


def _jsonify_exception(error: HTTPException) -> Tuple[Response, int]:
    response = error.get_response()
    response.data = json.dumps({"name": error.name, "description": error.description})
    response.content_type = "application/json"
    return response


ERROR_HANDLERS = (
    (400, lambda e: _jsonify_exception(e)),
    (503, lambda e: _jsonify_exception(e)),
    (403, lambda e: _jsonify_exception(e)),
)
