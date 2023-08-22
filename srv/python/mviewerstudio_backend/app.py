from .app_factory import create_app
from .utils.register_utils import ConfigRegister

app = create_app()

# create register to ease application management
app.register = ConfigRegister(app)
app.register.create_register_from_file_system()

if __name__ == "__main__":
    app.run()
