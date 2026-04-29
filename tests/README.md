# 🧪 Costloci Enterprise Test Suite

This directory contains the full-stack testing infrastructure for Costloci Enterprise, covering unit, integration (API), security, and E2E journeys.

## 📁 Structure

- **`unit/`**: Jest unit tests for core services (`AIGateway`, `RulesEngine`, `ROIService`).
- **`api/`**: Integration tests using Supertest to validate API contracts and multi-tenant isolation.
- **`e2e/`**: Playwright E2E tests covering the 11-stage enterprise customer journey.
- **`security/`**: Targeted security tests (Rate limiting, isolation).
- **`load/`**: k6 load testing scripts.
- **`helpers/`**: Test utilities and database cleanup tools.
- **`fixtures/`**: Sample PDFs and JSON data for tests.

## 🛠️ Setup & Prerequisites

1. **Environment Variables**:
   Ensure your `.env` contains:
   - `SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY` (for DB cleanup)
   - `DATABASE_URL`
   - `OPENAI_API_KEY` (or other AI keys for integration tests)

2. **Installation**:
   ```bash
   npm install
   npx playwright install
   ```

## 🏃 Running Tests

### Unit Tests
```bash
npm run test:unit
```

### API Integration Tests
Ensure the server is running (`npm run dev`) if testing against a live local instance, or use the integrated test server setup.
```bash
npm run test:api
```

### E2E Tests
```bash
npx playwright test tests/e2e/full_journey.spec.ts
```

### Security Tests
```bash
npm run test:security
```

## 🛡️ Security Isolation
The `contracts.spec.ts` API test specifically validates that `User A` cannot access `User B`'s contracts, even if they have the ID. This is enforced via the `storageContext` proxy in `server/storage.ts`.

## 🧹 Cleanup
The `tests/helpers/supabase-test-client.ts` contains a `cleanupDatabase()` function that removes all users with the `@costloci.test` domain and their associated data. This is run automatically in the `beforeAll` hooks of integration tests.
