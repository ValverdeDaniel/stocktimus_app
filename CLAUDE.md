# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Project Overview

This is a professional options analytics tool built with Django REST Framework backend and React frontend, intended for public deployment. The application provides options screening, portfolio tracking, and analytics for financial options trading.

## Architecture

**Full-Stack Structure:**
- **Backend**: Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend**: React 19 with React Router, Axios for API calls
- **Database**: PostgreSQL 15
- **Deployment**: Docker containers orchestrated with docker-compose

**Django Apps:**
- `backend/`: Main Django project settings and URL configuration
- `contracts/`: Core options functionality (models, API views, screener logic)
- `users/`: Authentication system with token-based auth
- Data source: EODHD API for real-time options and stock data

**Key Models:**
- `OptionContract`: Basic options data structure
- `SavedContract`: User portfolio contracts with tracking
- `WatchlistGroup`: Grouping mechanism for portfolio management
- `SavedScreenerParameter`: Saved screening configurations
- `Ticker`: Stock ticker reference data

## Development Commands

### Initial Setup (First Time)
```bash
# Start all services
docker-compose up --build

# Create Django superuser (in separate terminal after services are running)
docker-compose exec backend python manage.py createsuperuser
```

### Daily Development
```bash
# Start development environment
docker-compose up --build

# Backend management commands
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py collectstatic

# Load ticker data
docker-compose exec backend python manage.py load_tickers
docker-compose exec backend python manage.py search_tickers
```

### Frontend Development
```bash
# Start frontend development server (alternative to docker)
cd frontend
npm install
npm start  # Runs on localhost:3000 with proxy to backend

# Frontend testing and build
npm test
npm run build
```

### Database Access
```bash
# Connect to PostgreSQL directly
docker-compose exec db psql -U options_user -d options_db
```

## API Architecture

**Authentication**: Token-based via Django REST Framework
- All API endpoints require authentication except login/signup
- Frontend stores tokens and includes in request headers

**Main API Routes:**
- `api/run-screener/`: Options screening functionality
- `api/run-watchlist/`: Portfolio analysis
- `api/saved-contracts/`: User portfolio management
- `api/watchlist-groups/`: Portfolio grouping and simulation
- `api/ticker-search/`: Stock ticker lookup
- `api/options-chain/`: Real-time options data from EODHD
- `api/auth/login/` & `api/auth/signup/`: User authentication

## Python Development Environment (Alternative to Docker)

### Using UV (Recommended)
```bash
# Install UV
pip install uv

# Setup Python and virtual environment
uv python install 3.12
uv venv --python=$(uv python find 3.12)

# Windows activation
source .venv/Scripts/activate  # Git Bash
.venv\Scripts\activate         # CMD

# Install dependencies
uv pip install -r requirements.txt
```

### Benefits of UV
- 15-100x faster than pip
- Built-in Python version management
- Better dependency resolution

## Container Services

**Database (`db`):**
- PostgreSQL 15 on port 5432
- Database: `options_db`
- User: `options_user`
- Password: `secret123`

**Backend (`backend`):**
- Django on port 8000
- Auto-runs migrations and starts dev server
- Hot-reload enabled via volume mounting

**Frontend (`frontend`):**
- React development server on port 3000
- Proxy configured to backend:8000 in Docker
- Hot-reload enabled

## Development Notes

- Follow Django and React best practices for professional deployment
- API key for EODHD is configured in Django settings
- CORS enabled for local development
- All API endpoints use DRF token authentication
- Database uses environment variables for configuration
- Frontend uses axios for API communication with token headers