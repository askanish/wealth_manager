# Quick Start Guide

## Prerequisites
- Docker Desktop or Docker Engine installed
- Docker Compose installed
- Port 8080 and 5000 available on your machine

## Quick Start in 4 Steps

### Step 1: Navigate to Project Directory
```bash
cd /home/anishsk/Work/wealth_manager
```

### Step 2: Create a local environment file
```bash
cp .env.example .env
```

If you want live stock pricing from API Ninjas, add your key to the `.env` file. Leave it empty otherwise.

### Step 3: Start the Application
```bash
docker compose up --build
```

If your environment still uses the legacy command, this also works:
```bash
docker-compose up --build
```

Wait for messages indicating containers are running:
```
wealth-manager-backend  | Running on http://0.0.0.0:5000
wealth-manager-frontend | Configuration complete
```

### Step 4: Open in Browser
Visit: **http://localhost:8080**

## What You'll See

1. **Portfolio Summary** - At the top showing totals for each asset type
2. **Five Tabs** - One for each asset category:
   - Fixed Deposits
   - Mutual Funds
   - Stocks
   - RBI Bonds
   - PPF

## Try It Out

### Example: Add a Fixed Deposit
1. Click on "Fixed Deposits" tab
2. Fill in the form:
   - Bank Name: `HDFC Bank`
   - Principal: `100000`
   - Rate: `7.25`
   - Tenure: `12`
   - Maturity Date: Pick a date 12 months from now
3. Click "Add Fixed Deposit"
4. See it appear in the list below and in Portfolio Summary

### Example: Add a Stock
1. Click on "Stocks" tab
2. Fill in:
   - Stock Name: `Reliance Industries`
   - Symbol: `RELIANCE`
   - Quantity: `10`
   - Purchase Price: `2500`
   - Current Price: `2750`
   - Purchase Date: Today's date
3. Click "Add Stock"
4. Notice the gain calculation (profit shown as %)

## Stopping the Application

Press `Ctrl+C` in your terminal or run:
```bash
docker-compose down
```

## Persisting Your Data

Your data is stored in the `data/` folder and persists even after stopping the app!

To reset and start fresh:
```bash
rm -rf data/
docker-compose down
docker-compose up --build
```

## Troubleshooting

### Port Already in Use
If you get port conflicts, modify `docker-compose.yml`:
```yaml
ports:
  - "8081:80"      # Change 8080 to 8081
  - "5001:5000"    # Change 5000 to 5001
```

### Backend Not Connecting
- Wait 10 seconds for backend to fully initialize
- Check logs: `docker-compose logs backend`
- Make sure backend is running: `docker-compose ps`

### Page Won't Load
- Hard refresh browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try incognito/private window

## Next Steps

1. Add all your current investments
2. Keep the app running locally for testing
3. Review the README.md for advanced features
4. Consider modifications for your specific needs

## Development Commands

```bash
# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Run with specific port
docker-compose up -p 8081:80

# Build only (no start)
docker-compose build
```

---

**Happy wealth tracking!** 🎉
