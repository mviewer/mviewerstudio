# Installation

### Requirements

- A Linux system with `bash`
- Python 3 and `venv`
- `git` to clone the repository
- `apt` (optional) to automatically install system packages

The script will attempt to automatically install the following packages:
```sh
libxslt1-dev libxml2-dev python3 python3-pip python3-venv git
```

---

## Quick Installation (with the script)

### Step 1: Clone the repository

```sh
git clone https://github.com/mviewer/mviewerstudio.git
cd mviewerstudio
```

### Step 2: Run the installation script

From the project root:

```sh
bash ./install/install.sh
```

The script will:
- ✅ Create the virtual environment in `.venv`
- ✅ Install Python dependencies
- ✅ Configure necessary files

### Step 3: Configuration

The script displays the next steps, including:

- The path to the front configuration file: `src/static/config.json`
- Backend environment variables to export
- The command to start Flask

### Variant: Installation with clone in a different directory

```sh
bash ./install/install.sh <parent_directory> [branch] [directory_name]
```

Example:

```sh
bash ./install/install.sh /home/user/git develop mviewerstudio_develop
```

Parameters:
- `parent_directory`: parent directory where to clone the project
- `branch`: branch to check out after cloning
- `directory_name`: target folder name (default: `mviewerstudio`)

---

## Manual Installation (step by step)

### Step 1: Clone the repository

```sh
git clone https://github.com/mviewer/mviewerstudio.git
cd mviewerstudio
```

### Step 2: Create the virtual environment

```sh
python3 -m venv .venv
```

### Step 3: Activate the virtual environment

```sh
source .venv/bin/activate
```

### Step 4: Install Python dependencies

```sh
pip install -r install/requirements.txt
```

---

## Starting the application

### Step 1: Activate the virtual environment

```sh
source .venv/bin/activate
```

### Step 2: Configure environment variables (if necessary)

Check `src/static/config.json` for front-end configurations.

### Step 3: Launch Flask

```sh
flask --app src/app.py run -p 5007
```

The application will be available at: `http://localhost:5007`
