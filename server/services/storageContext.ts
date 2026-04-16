import { AsyncLocalStorage } from "async_hooks";
import { type SupabaseClient } from "@supabase/supabase-js";

export const storageContext = new AsyncLocalStorage<{ client: SupabaseClient, workspaceId?: number }>();
