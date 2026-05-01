import { supabase, adminClient } from "../../services/supabase.js";
import { type User, type UpsertUser } from "../../../shared/models/auth.js";
import { storage } from "../../storage";

/**
 * SOVEREIGN AUTH STORAGE (REST)
 * Fulfills the Replit Auth interface using HTTPS/443 calls to Supabase.
 * This ensures the auth layer is independent of Postgres-direct connectivity.
 */
export interface IAuthStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

class AuthRESTStorage implements IAuthStorage {
  private mapProfileToUser(row: any): User {
    if (!row) return row;
    return {
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      clientId: row.client_id,
      profileImageUrl: row.profile_image_url,
      subscriptionTier: row.subscription_tier ?? "starter",
      contractsCount: row.contracts_count ?? 0,
      apiKey: row.api_key,
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
    } as any as User;
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, email, first_name, last_name, role, client_id, profile_image_url, subscription_tier, contracts_count, api_key, updated_at")
      .eq("id", id)
      .maybeSingle();



    if (error) {
      await storage.createInfrastructureLog({
        component: "AuthStorage",
        event: "USER_FETCH_ERROR",
        status: "analyzing",
        actionTaken: `Failed to fetch user profile ${id}: ${error.message}`
      }).catch(() => {});
      return undefined;
    }
    return this.mapProfileToUser(data) || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const profilePayload: any = {
      id: userData.id,
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      role: userData.role,
      client_id: userData.clientId,
      subscription_tier: userData.subscriptionTier || "starter",
      contracts_count: userData.contractsCount || 0,
      api_key: userData.apiKey,
      updated_at: new Date().toISOString()
    };



    const { data, error } = await adminClient
      .from("profiles")
      .upsert(profilePayload, { onConflict: 'id' })
      .select("id, email, first_name, last_name, role, client_id, profile_image_url, subscription_tier, contracts_count, api_key, updated_at")
      .single();



    if (error) {
      await storage.createInfrastructureLog({
        component: "AuthStorage",
        event: "USER_UPSERT_ERROR",
        status: "critical",
        actionTaken: `Failed to provision user ${userData.id}: ${error.message}`
      }).catch(() => {});
      throw new Error(`Failed to provision user: ${error.message}`);
    }
    return this.mapProfileToUser(data);
  }
}

export const authStorage = new AuthRESTStorage();
