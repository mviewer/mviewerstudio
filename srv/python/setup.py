from setuptools import setup, find_packages

with open("requirements.txt") as f:
    REQUIREMENTS = f.read().split("\n")

setup(
    name="mviewerstudio_backend",
    version="0.2",
    description="A simple API for mviewerstudio",
    author="mviewer community",
    author_email="",
    url="https://github.com/mviewer/mviewerstudio",
    packages=find_packages(),
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
