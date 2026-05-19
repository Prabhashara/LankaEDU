# 🎓 LankaEdu Online Examination System - Makefile
# Streamlined build and development automation

.PHONY: help setup install dev dev-backend dev-frontend clean build

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m

# Default target
.DEFAULT_GOAL := help

# Variables
BACKEND_DIR := backend
FRONTEND_DIR := frontend
BACKEND_PORT := 5001
FRONTEND_PORT := 5173

# ============================================
# 📖 HELP
# ============================================
help:
	@echo "$(BLUE)===================================$(NC)"
	@echo "$(BLUE)🎓 LankaEdu - Makefile Commands$(NC)"
	@echo "$(BLUE)===================================$(NC)"
	@echo ""
	@echo "$(GREEN)📦 Setup & Installation:$(NC)"
	@echo "  make setup              - Complete project setup (install all)"
	@echo "  make install            - Install backend + frontend dependencies"
	@echo ""
	@echo "$(GREEN)▶️  Development:$(NC)"
	@echo "  make dev                - Start both backend and frontend"
	@echo "  make dev-backend        - Start backend only"
	@echo "  make dev-frontend       - Start frontend only"
	@echo ""
	@echo "$(GREEN)🏗️  Build:$(NC)"
	@echo "  make build              - Build entire project"
	@echo "  make build-backend      - Build backend only"
	@echo "  make build-frontend     - Build frontend only"
	@echo ""
	@echo "$(GREEN)🧹 Cleanup:$(NC)"
	@echo "  make clean              - Clean all build artifacts"
	@echo "  make clean-backend      - Clean backend only"
	@echo "  make clean-frontend     - Clean frontend only"
	@echo ""
	@echo "$(GREEN)📝 Setup Files:$(NC)"
	@echo "  make env-setup          - Create .env files"
	@echo ""

# ============================================
# 📝 ENVIRONMENT SETUP
# ============================================
env-setup:
	@echo "$(BLUE)Setting up environment files...$(NC)"
	@if [ ! -f $(BACKEND_DIR)/.env ]; then \
		cp $(BACKEND_DIR)/.env.example $(BACKEND_DIR)/.env 2>/dev/null || echo "$(YELLOW)⚠ .env.example not found in backend$(NC)"; \
		echo "$(GREEN)✓ Created $(BACKEND_DIR)/.env$(NC)"; \
	else \
		echo "$(YELLOW)⚠ $(BACKEND_DIR)/.env already exists$(NC)"; \
	fi
	@if [ ! -f $(FRONTEND_DIR)/.env ]; then \
		cp $(FRONTEND_DIR)/.env.example $(FRONTEND_DIR)/.env 2>/dev/null || echo "$(YELLOW)⚠ .env.example not found in frontend$(NC)"; \
		echo "$(GREEN)✓ Created $(FRONTEND_DIR)/.env$(NC)"; \
	else \
		echo "$(YELLOW)⚠ $(FRONTEND_DIR)/.env already exists$(NC)"; \
	fi

# ============================================
# 📦 INSTALLATION
# ============================================
install: env-setup install-backend install-frontend
	@echo "$(GREEN)✓ All dependencies installed$(NC)"

install-backend:
	@echo "$(BLUE)Installing backend dependencies...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean install -q -DskipTests
	@echo "$(GREEN)✓ Backend dependencies installed$(NC)"

install-frontend:
	@echo "$(BLUE)Installing frontend dependencies...$(NC)"
	@cd $(FRONTEND_DIR) && npm install
	@echo "$(GREEN)✓ Frontend dependencies installed$(NC)"

# ============================================
# 🏗️  BUILD
# ============================================
build: build-backend build-frontend
	@echo "$(GREEN)✓ Project built successfully$(NC)"

build-backend:
	@echo "$(BLUE)Building backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean package -q -DskipTests
	@echo "$(GREEN)✓ Backend built$(NC)"

build-frontend:
	@echo "$(BLUE)Building frontend...$(NC)"
	@cd $(FRONTEND_DIR) && npm run build
	@echo "$(GREEN)✓ Frontend built$(NC)"

# ============================================
# ▶️  DEVELOPMENT MODE
# ============================================
dev: env-setup
	@echo "$(BLUE)Starting LankaEdu in development mode...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:$(BACKEND_PORT)$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:$(FRONTEND_PORT)$(NC)"
	@echo "$(BLUE)Press Ctrl+C to stop$(NC)"
	@echo ""
	@(cd $(BACKEND_DIR) && mvn spring-boot:run &) & \
	(cd $(FRONTEND_DIR) && npm run dev &) & \
	wait

dev-backend:
	@echo "$(BLUE)Starting backend only...$(NC)"
	@echo "$(YELLOW)Running on: http://localhost:$(BACKEND_PORT)$(NC)"
	@cd $(BACKEND_DIR) && mvn spring-boot:run

dev-frontend:
	@echo "$(BLUE)Starting frontend only...$(NC)"
	@echo "$(YELLOW)Running on: http://localhost:$(FRONTEND_PORT)$(NC)"
	@cd $(FRONTEND_DIR) && npm run dev

# ============================================
# 🧹 CLEANUP
# ============================================
clean: clean-backend clean-frontend
	@echo "$(GREEN)✓ Project cleaned$(NC)"

clean-backend:
	@echo "$(BLUE)Cleaning backend...$(NC)"
	@cd $(BACKEND_DIR) && mvn clean -q
	@echo "$(GREEN)✓ Backend cleaned$(NC)"

clean-frontend:
	@echo "$(BLUE)Cleaning frontend...$(NC)"
	@cd $(FRONTEND_DIR) && rm -rf dist node_modules package-lock.json
	@echo "$(GREEN)✓ Frontend cleaned$(NC)"

# ============================================
# 📚 COMPLETE SETUP
# ============================================
setup: install
	@echo ""
	@echo "$(GREEN)======================================$(NC)"
	@echo "$(GREEN)✓ LankaEdu setup complete!$(NC)"
	@echo "$(GREEN)======================================$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  1. Configure DATABASE_URL in $(BACKEND_DIR)/.env"
	@echo "  2. Load mock data (via database client)"
	@echo "  3. Start development: make dev"
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
