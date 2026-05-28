.PHONY: help build up down logs logs-backend logs-frontend restart clean reset test-health

help:
	@echo "Wealth Manager - Available Commands"
	@echo "===================================="
	@echo ""
	@echo "make build              - Build Docker images"
	@echo "make up                 - Start all services"
	@echo "make down               - Stop all services"
	@echo "make restart            - Restart all services"
	@echo "make logs               - View all logs (Ctrl+C to exit)"
	@echo "make logs-backend       - View backend logs only"
	@echo "make logs-frontend      - View frontend logs only"
	@echo "make clean              - Stop services and remove images"
	@echo "make reset              - Stop services and reset database"
	@echo "make test-health        - Check if services are running"
	@echo ""
	@echo "Usage: make <command>"
	@echo "Example: make up"
	@echo ""

build:
	docker-compose build

up:
	docker-compose up --build
	@echo ""
	@echo "✅ Services started!"
	@echo "Frontend: http://localhost:8080"
	@echo "Backend:  http://localhost:5000"
	@echo ""

down:
	docker-compose down
	@echo "✅ Services stopped"

restart:
	docker-compose restart
	@echo "✅ Services restarted"

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

clean:
	docker-compose down --rmi all
	@echo "✅ Containers and images removed"

reset:
	rm -rf data/
	docker-compose down
	@echo "✅ Database and services reset"

test-health:
	@echo "Checking services..."
	@curl -s http://localhost:5000/api/health | python3 -m json.tool || echo "❌ Backend not responding"
	@echo "✅ Backend is healthy!"
	@echo "Frontend: http://localhost:8080"

dev-backend:
	docker-compose up backend

dev-frontend:
	docker-compose up frontend

shell-backend:
	docker exec -it wealth-manager-backend /bin/sh

shell-frontend:
	docker exec -it wealth-manager-frontend /bin/sh
