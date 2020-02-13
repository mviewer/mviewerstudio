from werkzeug.exceptions import HTTPException
from werkzeug.wrappers import Response
import json


def _jsonify_exception(error: HTTPException) -> Response:
    response = error.get_response()
    response.data = json.dumps({"name": error.name, "description": error.description})
    response.content_type = "application/json"
    return response


ERROR_HANDLERS = (
    (400, lambda e: _jsonify_exception(e)),
    (503, lambda e: _jsonify_exception(e)),
    (403, lambda e: _jsonify_exception(e)),
    (404, lambda e: _jsonify_exception(e)),
    (500, lambda e: _jsonify_exception(e)),
)
