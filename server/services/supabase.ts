import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("Supabase credentials missing. Auth will fallback to Replit OIDC.");
}

export const supabase = createClient(
  process.env.SUPABASE_URL || "https://ulercnwyckrcjcnrenzz.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);
