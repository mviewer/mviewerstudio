from .app_factory import create_app
from .register_utils import ConfigRegister

app = create_app()

app.register = ConfigRegister(app.config["EXPORT_CONF_FOLDER"])

if __name__ == "__main__":
    app.run()
