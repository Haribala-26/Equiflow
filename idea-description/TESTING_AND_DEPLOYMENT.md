# Equiflow — Testing & Deployment Guide

## 1. Automated Verification & Quality Gates

Equiflow implements a three-tier quality gate pipeline:

```bash
# 1. Strict TypeScript Static Type Checking
npm run typecheck

# 2. Automated Vitest Unit & Integration Test Suite
npm run test

# 3. Next.js 15 Production Build & Bundle Compilation
npm run build
```

### 1.1 Test Suite Breakdown (37 Tests across 8 Suites)
1. `tests/unit/rbac.test.ts`: Verifies permission matrix integrity for Administrator, Coordinator, and auxiliary roles.
2. `tests/unit/priority.test.ts`: Validates MCDA formula scoring, log-scale population impact, and score bounds (0–100).
3. `tests/unit/allocation.test.ts`: Tests constrained optimization, proportional rationing under deficit, and zero over-allocation invariants.
4. `tests/unit/integrations.test.ts`: Verifies Gemini AI parsing, fallback parser, and Elephant-Goldfish audit adapters.
5. `tests/unit/repository-contract.test.ts`: Validates behavioral parity between `MockRepository` and `PrismaRepository`.
6. `tests/unit/weight-validation.test.ts`: Enforces Zod sum-to-100% validation, formula versioning, and mandatory audit justification reasons.
7. `tests/integration/api.test.ts`: Tests end-to-end operational lifecycle: inspection -> scoring -> allocation -> approval -> stock deduction.
8. `tests/integration/rbac-api.test.ts`: Verifies that unauthorized roles calling privileged endpoints receive **HTTP 403 Forbidden**.

---

## 2. Containerized Deployment (Docker & PostgreSQL 16)

The project includes production-ready Docker Compose orchestration defining both the application and a high-performance PostgreSQL service with health checks:

```yaml
# docker-compose.yml excerpt
services:
  postgres:
    image: postgres:16-alpine
    container_name: equiflow-postgres
    restart: always
    environment:
      POSTGRES_DB: equiflow
      POSTGRES_USER: equiflow_user
      POSTGRES_PASSWORD: equiflow_secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U equiflow_user -d equiflow"]
      interval: 5s
      timeout: 5s
      retries: 5

  web:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: equiflow-web
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATA_SOURCE=prisma
      - DATABASE_URL=postgresql://equiflow_user:equiflow_secure_password@postgres:5432/equiflow?schema=public
    depends_on:
      postgres:
        condition: service_healthy
```

### 2.1 Quickstart with Docker Compose

```bash
# 1. Start all containers in detached mode
docker compose up -d

# 2. Run database migrations inside web container
docker compose exec web npx prisma migrate deploy

# 3. Seed deterministic Chennai baseline
docker compose exec web npx tsx prisma/seed.ts

# 4. Access the web platform at http://localhost:3000
```

---

## 3. Environment Variables Configuration

Configuration is managed via `.env.example` and local `.env.local`:

```bash
# Data Source: "mock" (in-memory baseline) or "prisma" (live PostgreSQL)
DATA_SOURCE="mock"

# PostgreSQL Connection String (used when DATA_SOURCE="prisma")
DATABASE_URL="postgresql://equiflow_user:equiflow_secure_password@localhost:5432/equiflow?schema=public"

# Google Gemini API Key for semantic report extraction
GEMINI_API_KEY=""

# Cryptographic secret for session cookies
SESSION_SECRET="equiflow_secure_session_secret_2026_chennai_emergency"

# Web Server Port
PORT=3000
```
