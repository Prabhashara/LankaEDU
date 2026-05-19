# LankaEdu Online Examination System - Makefile
# Streamlined build and development automation

.PHONY: help setup env-setup install install-backend install-frontend build build-backend build-frontend dev dev-backend dev-frontend clean clean-backend clean-frontend clean-deps

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Variables
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_PORT := 5001
FRONTEND_PORT := 5173

help:
	@echo "$(BLUE)===================================$(NC)"
	@echo "$(BLUE)LankaEdu - Makefile Commands$(NC)"
	@echo "$(BLUE)===================================$(NC)"
	@echo ""
	@echo "$(GREEN)Setup and installation:$(NC)"
	@echo "  make setup              - Complete project setup (install all)"
	@echo "  make install            - Install backend + frontend dependencies"
	@echo "  make env-setup          - Create .env files from examples"
	@echo ""
	@echo "$(GREEN)Development:$(NC)"
	@echo "  make dev                - Start both backend and frontend"
	@echo "  make dev-backend        - Start backend only"
	@echo "  make dev-frontend       - Start frontend only"
	@echo ""
	@echo "$(GREEN)Build:$(NC)"
	@echo "  make build              - Build entire project"
	@echo "  make build-backend      - Build backend only"
	@echo "  make build-frontend     - Build frontend only"
	@echo ""
	@echo "$(GREEN)Cleanup:$(NC)"
	@echo "  make clean              - Clean all build artifacts"
	@echo "  make clean-backend      - Clean backend only"
	@echo "  make clean-frontend     - Clean frontend only"
	@echo "  make clean-deps         - Remove installed dependencies"
	@echo ""

env-setup:
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		if [ -f $(BACKEND_DIR)/.env.example ]; then \
			cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env; \
			echo "$(GREEN)Created $(BACKEND_DIR)/.env$(NC)"; \
		else \
			echo "$(RED)Missing $(BACKEND_DIR)/.env.example$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(YELLOW)$(BACKEND_DIR)/.env already exists$(NC)"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
		if [ -f $(FRONTEND_DIR)/.env.example ]; then \
			cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env; \
			echo "$(GREEN)Created $(FRONTEND_DIR)/.env$(NC)"; \
		else \
			echo "$(RED)Missing $(FRONTEND_DIR)/.env.example$(NC)"; \
			exit 1; \
		fi; \
	else \
		echo "$(YELLOW)$(FRONTEND_DIR)/.env already exists$(NC)"; \
	fi

install: env-setup install-backend install-frontend
	@echo "$(GREEN)All dependencies installed$(NC)"

install-backend:
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean install -q -DskipTests
	@echo "$(GREEN)Backend dependencies installed$(NC)"

install-frontend:
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm ci
	@echo "$(GREEN)Frontend dependencies installed$(NC)"

build: build-backend build-frontend
	@echo "$(GREEN)Project built successfully$(NC)"

build-backend:
	@echo "$(BLUE)Building backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean package -q -DskipTests
	@echo "$(GREEN)Backend built$(NC)"

build-frontend:
	@echo "$(BLUE)Building frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)Frontend built$(NC)"

dev: env-setup
	@echo "$(BLUE)Starting LankaEdu in development mode...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:$(BACKEND_PORT)$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"
	@echo "$(BLUE)Press Ctrl+C to stop$(NC)"
	@echo ""
	@set -e; \
	(cd $(BACKEND_DIR) && mvn spring-boot:run) & \
	BACKEND_PID=$$!; \
	trap 'kill $$BACKEND_PID 2>/dev/null || true' INT TERM EXIT; \
	cd $(FRONTEND_DIR) && npm run dev

dev-backend:
	@echo "$(BLUE)Starting backend only...$(NC)"
	@echo "$(YELLOW)Running on: http://localhost:$(BACKEND_PORT)$(NC)"
	@cd $(BACKEND_DIR) && mvn spring-boot:run

dev-frontend:
	@echo "$(BLUE)Starting frontend only...$(NC)"
	@echo "$(YELLOW)Running on: http://localhost:$(FRONTEND_PORT)$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

clean: clean-backend clean-frontend
	@echo "$(GREEN)Project cleaned$(NC)"

clean-backend:
	@echo "$(BLUE)Cleaning backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean -q
	@rm -rf $(BACKEND_DIR)/private
	@echo "$(GREEN)Backend cleaned$(NC)"

clean-frontend:
	@echo "$(BLUE)Cleaning frontend...$(NC)"
	@rm -rf $(FRONTEND_DIR)/dist $(FRONTEND_DIR)/.vite
	@echo "$(GREEN)Frontend cleaned$(NC)"

clean-deps:
	@echo "$(BLUE)Removing installed dependencies...$(NC)"
	@rm -rf $(FRONTEND_DIR)/node_modules
	@echo "$(GREEN)Dependencies removed$(NC)"

setup: install
	@echo ""
	@echo "$(GREEN)======================================$(NC)"
	@echo "$(GREEN)LankaEdu setup complete!$(NC)"
	@echo "$(GREEN)======================================$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Configure DATABASE_URL in $(BACKEND_DIR)/.env"
	@echo "  2. Run the database setup SQL from README.md if needed"
	@echo "  3. Start development with: make dev"
	@echo ""
	@echo "$(YELLOW)Quick commands:$(NC)"
	@echo "  make dev                # Start both services"
	@echo "  make dev-backend        # Backend only"
	@echo "  make dev-frontend       # Frontend only"
	@echo "  make clean              # Clean all artifacts"
	@echo ""
	@echo "$(YELLOW)Test Credentials:$(NC)"
	@echo "  Admin:    admin@example.com / admin123"
	@echo "  Lecturer: lecturer@example.com / lecturer123"
	@echo "  Student:  student@example.com / student123"
	@echo ""
