import { adminClient as supabase } from "../../services/supabase";
import { type User, type UpsertUser } from "@shared/models/auth";

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
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
    } as any as User;
  }

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, role, client_id, profile_image_url, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[AUTH STORAGE ERROR]", error.message);
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
      updated_at: new Date().toISOString()
    };

    console.log(`[AUTH-DIAG] upsertUser Payload: id=${userData.id} clientId=${userData.clientId}`);
    const { data, error } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: 'id' })
      .select("id, email, first_name, last_name, role, client_id, profile_image_url, updated_at")
      .single();

    if (error) {
      console.error("[AUTH UPSERT ERROR]", error.message);
      throw new Error(`Failed to provision user: ${error.message}`);
    }
    return this.mapProfileToUser(data);
  }
}

export const authStorage = new AuthRESTStorage();
