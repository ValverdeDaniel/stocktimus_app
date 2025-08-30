# shadowstocks
testnew

original readme:
code that is active can be found in the Version 1 file
in there there is a readme.txt file that explains some of the output and inputs of the functions creating the tables

3tables_base.ipynb is the file that runs the functions from the other files and can be used for personal analysis

we are currently using eodhd.com as the data source through their api


other interesting apis that we came across are:
polygon.io (has live options data)
financial modeling prep
alphavantage



updated readme 06/17/25

# Shadowstocks Project

## Overview

This repository contains two main parts:

* **3tables\_base**: The personal exploratory phase of the project, intended for internal experimentation and analysis.

* **Optionstables v2**: The public-facing component designed specifically for bulk options data processing and analysis on the platform.

## Getting Started

To set up your environment and install the necessary packages using Anaconda, follow these steps:

1. **Clone the repository:**

```bash
git clone <repository-url>
cd shadowstocks
```

2. **Create and activate a new Conda environment:**

```bash
conda create --name shadowstocks python=3.10
conda activate shadowstocks
```

3. **Install required packages:**

```bash
pip install -r requirements.txt
```

Now you're ready to use both `3tables_base` and `Optionstables v2`.
