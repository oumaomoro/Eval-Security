import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, integer, text, boolean, uuid } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// Targets the "profiles" table in the public schema.
export const users = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  clientId: integer("client_id"),
  role: varchar("role").default("analyst"), // admin, analyst, executive
  profileImageUrl: varchar("profile_image_url"),
  webauthnId: varchar("webauthn_id"),
  webauthnCredential: text("webauthn_credential"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  subscriptionTier: varchar("subscription_tier").default("starter"), // starter, pro, enterprise
  contractsCount: integer("contracts_count").default(0),
  apiKey: text("api_key"),
  createdAt: timestamp("created_at").defaultNow(),

  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert & { email?: string };
export type User = typeof users.$inferSelect & { email?: string };
