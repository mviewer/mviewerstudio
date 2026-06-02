from .shared import basic_store

# Route registration side effects
from . import configs  # noqa: F401
from . import docs  # noqa: F401
from . import proxy  # noqa: F401
from . import qgis  # noqa: F401
from . import versions  # noqa: F401

__all__ = ["basic_store"]
