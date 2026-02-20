# Rootless Docker: auto-detect socket path
export DOCKER_SOCK ?= /run/user/$(shell id -u)/docker.sock

.PHONY: help up up-frontend local down build build-no-cache logs \
	frontend-install frontend-dev frontend-lint \
	backend-install backend-dev backend-lint npm inpm \
	clean

help:
	@echo "Targets:"
	@echo "  up                - full stack (traefik + tunnel + docs)"
	@echo "  up-frontend       - frontend only"
	@echo "  down              - stop all services"
	@echo "  build             - docker compose build"
	@echo "  build-no-cache    - docker compose build --no-cache"
	@echo "  logs              - docker compose logs -f --tail=100"
	@echo "  local             - local dev with Docker (uses .env.local)"
	@echo "  npm               - local dev (frontend + backend without Docker)"
	@echo "  frontend-install  - npm install in ./frontend"
	@echo "  frontend-dev      - npm run dev in ./frontend"
	@echo "  frontend-lint     - npm run lint in ./frontend"
	@echo "  backend-install   - npm install in ./backend"
	@echo "  backend-dev       - npm run start:dev in ./backend"
	@echo "  backend-lint      - npm run lint in ./backend"
	@echo "  clean             - stop all, remove volumes and database"

# frontendディレクトリに（npm run dev）と、backend(npm run start:dev)の両方を同時に実行するコマンド

npm:
	@test -d $(CURDIR)/frontend/node_modules || (cd $(CURDIR)/frontend && npm install)
	@test -d $(CURDIR)/backend/node_modules || (cd $(CURDIR)/backend && npm install)
	cd $(CURDIR)/frontend && npm run dev & \
	cd $(CURDIR)/backend && npm run start:dev & \
	wait

inpm:
	@cd $(CURDIR)/frontend && npm ls --depth=0 >/dev/null 2>&1 || npm install
	@cd $(CURDIR)/backend && npm ls --depth=0 >/dev/null 2>&1 || npm install
	cd $(CURDIR)/frontend && npm run dev & \
	cd $(CURDIR)/backend && npm run start:dev & \
	wait

local:
	@test -f .env.local || (echo "Error: .env.local not found. Copy .env.local.example to .env.local and fill in secrets." && exit 1)
	docker compose --env-file .env.local up --build

up:
	docker compose --profile production --profile docs up --build

up-frontend:
	docker compose up --build frontend

down:
	docker compose --profile production --profile docs down --remove-orphans

build:
	docker compose build

build-no-cache:
	docker compose build --no-cache

logs:
	docker compose logs -f --tail=100

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-lint:
	cd frontend && npm run lint

backend-install:
	cd backend && npm install

backend-dev:
	cd backend && npm run start:dev

backend-lint:
	cd backend && npm run lint

clean:
	docker compose --profile production --profile docs down -v --remove-orphans
	rm -rf data/backend
	@echo "Cleaned: volumes removed, data/backend deleted."

