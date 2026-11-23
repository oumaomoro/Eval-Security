# Costloci

Enterprise cybersecurity contract management and governance platform.

## Overview

Costloci automates contract review, compliance auditing, and risk management for cybersecurity teams. It surfaces savings opportunities, enforces regulatory standards, and provides real-time vendor intelligence.

**Production URLs**
- Frontend: [costloci.com](https://costloci.com) — Cloudflare Pages
- Backend API: [api.costloci.com](https://api.costloci.com) — Vercel

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Shadcn/ui, Recharts |
| Backend | Node.js, Express, Drizzle ORM, PostgreSQL |
| Auth | Supabase (JWT + RBAC) |
| AI | OpenAI GPT-4o |
| Deploy | Cloudflare Pages (frontend), Vercel (backend) |

## Quick Start

```bash
npm install
npm run dev
```

```bash
# Type check
npm run check

# Build
npm run build

# Tests
npm run test:unit
npm run test:security
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values. See `docs/` for service-specific setup guides.

## Architecture

See [ENTERPRISE_ARCHITECTURE.md](ENTERPRISE_ARCHITECTURE.md) for the full technical design.

## Compliance

Supports KDPA, GDPR, POPIA, CBK, ISO 27001, and SOC 2 frameworks.
