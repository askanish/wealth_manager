# Wealth Manager

A Docker-based personal finance dashboard for tracking fixed deposits, mutual funds, stocks, RBI bonds, and PPF contributions in one place.

![Wealth Manager Screenshot](WealthManager.png)

## Overview

Wealth Manager is a lightweight Flask + Nginx app that lets you:

- manage multiple investment categories in one dashboard
- track portfolio totals and asset allocation
- view live summaries for individual asset classes
- store data in SQLite for local, persistent tracking
- run completely with Docker on a local machine

## Features

- Fixed Deposits tracking with interest rate, tenure, and maturity date
- Mutual Fund tracking with units, NAV, and total value
- Stock tracking with quantity, purchase value, and current value
- RBI Bond tracking with bond type and maturity details
- PPF contribution tracking with annual summary fields
- Portfolio summary cards and visual breakdowns
- Responsive, tab-based frontend UI
- Local SQLite persistence without external database setup

## Tech Stack

- Backend: Python, Flask
- Frontend: HTML, Bootstrap, JavaScript
- Web server: Nginx
- Database: SQLite
- Runtime: Docker + Docker Compose

## Project Structure

```text
wealth_manager/
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
├── .gitignore
├── README.md
├── QUICKSTART.md
├── SETUP_SUMMARY.md
├── backend/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── nginx.conf
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
├── data/
└── WealthManager.png
```

## Prerequisites

Before running the app, make sure you have:

- Docker installed
- Docker Compose installed
- Access to ports 5000 and 8080 on your machine
- A modern browser

## Quick Start

1. Open a terminal and go to the project directory:

   ```bash
   cd /home/anishsk/Work/wealth_manager
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the app:

   ```bash
   docker compose up --build
   ```

   If your machine uses the older syntax, this also works:

   ```bash
   docker-compose up --build
   ```

4. Open the app in a browser:

   ```text
   http://localhost:8080
   ```

5. Stop the app when done:

   ```bash
   docker compose down
   ```

## Optional API Key

The app supports an optional external API for live stock data and currency conversion using API Ninjas.

- Do not store secrets in the repository.
- Use the local `.env` file instead.
- Example:

  ```bash
  API_NINJAS_KEY=your_real_key_here
  ```

If no key is present, the app falls back to safe default values and continues to run normally.

## Environment and Secrets

This project intentionally avoids hardcoded secrets.

- keep your real API key in a local `.env` file
- do not commit `.env` to Git
- the repo contains only the template file [.env.example](.env.example)

## Services

### Backend

- URL: http://localhost:5000
- Container: `wealth-manager-backend`
- Framework: Flask
- Database: SQLite

### Frontend

- URL: http://localhost:8080
- Container: `wealth-manager-frontend`
- Server: Nginx
- UI: Bootstrap-based dashboard

## Data Storage

The app stores data in the local `data/` volume, so records persist between restarts unless you remove the data folder.

To reset the database:

```bash
rm -rf data
sudo docker compose down
sudo docker compose up --build
```

## API Endpoints

### Assets

- `GET /api/fixed-deposits`
- `POST /api/fixed-deposits`
- `GET /api/mutual-funds`
- `POST /api/mutual-funds`
- `GET /api/stocks`
- `POST /api/stocks`
- `GET /api/rbi-bonds`
- `POST /api/rbi-bonds`
- `GET /api/ppf`
- `POST /api/ppf`

### Portfolio

- `GET /api/portfolio-summary`
- `GET /api/portfolio-snapshots`
- `POST /api/portfolio-snapshot`

### Health

- `GET /api/health`

## Usage

1. Open the dashboard in the browser.
2. Choose an asset tab from the left sidebar.
3. Fill in the form and submit the entry.
4. Watch the totals and summary cards update automatically.

## Troubleshooting

### Docker permission issues

If Docker says the socket is not accessible, make sure the Docker daemon is running and your user can access it:

```bash
sudo systemctl start docker
sudo usermod -aG docker $USER
newgrp docker
```

### Port already in use

Change the port mapping in Docker Compose if needed.

### No live stock values

This is expected if `API_NINJAS_KEY` is not set. The app still works with fallback values.

## Development

- Frontend edits live under the `frontend/` directory
- Backend edits live under the `backend/` directory
- Rebuild with:

  ```bash
  docker compose up --build
  ```

## Roadmap

- user authentication
- CSV/PDF export
- portfolio analytics and goals
- recurring transaction support
- mobile-friendly enhancements

## License

This project is open source and intended for personal or local-use finance tracking.

## Support

For issues or feature requests, use the repository issue tracker or contribute through a pull request.

---

Built for tracking wealth, one investment at a time.
