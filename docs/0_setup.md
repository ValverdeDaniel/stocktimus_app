# Python Development Environment Setup with UV

This guide explains how to set up a Python development environment using `uv`, a fast Python package installer and resolver written in Rust.

## Installation and Setup Commands

### 1. Install UV
```bash
pip install uv
```
UV is a fast alternative to pip, written in Rust. It handles dependency resolution and package installation much faster than traditional tools.

### 2. Install Python
```bash
uv python install 3.12
```
This command downloads and installs Python 3.12. UV can manage multiple Python versions for you.

### 3. Create Virtual Environment
```bash
uv venv --python=$(uv python find 3.12)
```
Creates a new virtual environment using the installed Python 3.12. The `uv python find` command locates the correct Python binary.

### 4. Activate Virtual Environment
```bash
source .venv/Scripts/activate  # On Windows with Git Bash
# OR
.venv\Scripts\activate        # On Windows with CMD
```
Activates the virtual environment, isolating your project's dependencies.

### 5. Install Dependencies
```bash
uv pip install -r requirements.txt
```
Installs all project dependencies listed in requirements.txt using UV's fast installer.

## Benefits of Using UV

- Much faster than pip (15-100x faster)
- Built-in Python version management
- Better dependency resolution
- Automatic wheel preference over source distributions
- Built-in virtual environment management

## Common Issues

If you encounter issues with scientific packages (like NumPy or SciPy), try:
```bash
uv pip install --no-build-isolation --only-binary=:all: numpy scipy pandas
```

## Additional UV Commands

- List available Python versions: `uv python list`
- Show path to specific Python: `uv python find 3.12`
- Clean UV cache: `uv cache clean`
