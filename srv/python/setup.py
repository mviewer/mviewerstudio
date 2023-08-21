from setuptools import setup, find_packages

with open("requirements.txt") as f:
    REQUIREMENTS = f.read().split("\n")

setup(
    name="mviewerstudio_backend",
    version="0.1",
    description="api for mviewerstudio",
    author="Camptocamp",
    author_email="info@camptocamp.com",
    url="https://github.com/mviewer/mviewerstudio",
    packages=find_packages(),
    install_requires=REQUIREMENTS,
    classifiers=[
        "Programming Language :: Python",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Framework :: Flask",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
    ],
)
