.PHONY: help up up-frontend down build build-no-cache logs \
	frontend-install frontend-dev frontend-lint \
	backend-install backend-dev backend-lint npm \

help:
	@echo "Targets:"
	@echo "  up                - docker compose up --build"
	@echo "  up-frontend        - docker compose up --build frontend"
	@echo "  down              - docker compose down --remove-orphans"
	@echo "  build             - docker compose build"
	@echo "  build-no-cache     - docker compose build --no-cache"
	@echo "  logs              - docker compose logs -f --tail=100"
	@echo "  frontend-install  - npm install in ./frontend"
	@echo "  frontend-dev      - npm run dev in ./frontend"
	@echo "  frontend-lint     - npm run lint in ./frontend"
	@echo "  backend-install   - npm install in ./backend"
	@echo "  backend-dev       - npm run start:dev in ./backend"
	@echo "  backend-lint      - npm run lint in ./backend"

# frontendディレクトリに（npm run dev）と、backend(npm run start:dev)の両方を同時に実行するコマンド
npm:
	@test -d $(CURDIR)/frontend/node_modules || (cd $(CURDIR)/frontend && npm install)
	@test -d $(CURDIR)/backend/node_modules || (cd $(CURDIR)/backend && npm install)
	cd $(CURDIR)/frontend && npm run dev & \
	cd $(CURDIR)/backend && npm run start:dev & \
	wait

up:
	docker compose up --build

up-frontend:
	docker compose up --build frontend

down:
	docker compose down --remove-orphans

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
