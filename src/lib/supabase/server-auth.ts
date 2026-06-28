import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const [scheme, token] = authorization.split(" ");
  return scheme?.toLowerCase() === "bearer" && token ? token : null;
}

export function getSupabaseServerClient(accessToken?: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase env is not configured.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function getUserFromRequest(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return { token: null, user: null };
  }

  const supabase = getSupabaseServerClient(token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { token, user: null };
  }

  return { token, user: data.user };
}

