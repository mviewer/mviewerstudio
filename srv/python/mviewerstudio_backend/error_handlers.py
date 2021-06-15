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
        f"An error occured. Error code {response.status_code}, name: {error.name}"
    )
    return response


ERROR_HANDLERS = (
    (400, lambda e: _jsonify_exception(e)),
    (503, lambda e: _jsonify_exception(e)),
    (403, lambda e: _jsonify_exception(e)),
    (404, lambda e: _jsonify_exception(e)),
    (500, lambda e: _jsonify_exception(e)),
)
