import { jest } from "@jest/globals";
import { cleanupDatabase } from "./supabase-test-client";

// Global timeout for long-running AI/API tests
jest.setTimeout(30000);

// We can optionally run cleanup before each test file
// However, since we are doing multi-tenant isolation tests, 
// we might want to keep the state during a single file run.
