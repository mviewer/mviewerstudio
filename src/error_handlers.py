from flask import request
from werkzeug.exceptions import HTTPException
from werkzeug import Response
import json
import logging

logger = logging.getLogger(__name__)


def _jsonify_exception(error: HTTPException) -> Response:
    response = error.get_response()
    response.data = json.dumps({"name": error.name, "description": error.description})
    response.content_type = "application/json"
    logger.warning(
        "An error occured. Error code %s, name: %s, method: %s, path: %s, referrer: %s",
        response.status_code,
        error.name,
        request.method,
        request.path,
        request.referrer,
    )
    return response


ERROR_HANDLERS = (
    (400, lambda e: _jsonify_exception(e)),
    (503, lambda e: _jsonify_exception(e)),
    (403, lambda e: _jsonify_exception(e)),
    (404, lambda e: _jsonify_exception(e)),
    (500, lambda e: _jsonify_exception(e)),
)
