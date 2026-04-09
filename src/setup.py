from pathlib import Path

from setuptools import find_namespace_packages, setup

ROOT_DIR = Path(__file__).resolve().parent.parent
REQUIREMENTS_PATH = ROOT_DIR / "install" / "requirements.txt"
REQUIREMENTS = [
    line.strip()
    for line in REQUIREMENTS_PATH.read_text().splitlines()
    if line.strip() and not line.strip().startswith("#")
]

setup(
    name="mviewerstudio_backend",
    version="0.2",
    description="A simple API for mviewerstudio",
    author="mviewer community",
    author_email="",
    url="https://github.com/mviewer/mviewerstudio",
    packages=find_namespace_packages(include=["models", "models.*", "utils", "utils.*"]),
    py_modules=[
        "app",
        "app_factory",
        "error_handlers",
        "register_utils",
        "route",
        "settings",
        "test",
    ],
    install_requires=REQUIREMENTS,
    python_requires=">=3.11",
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Framework :: Flask",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
    ],
)
