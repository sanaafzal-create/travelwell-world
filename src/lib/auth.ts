/**
 * TravelWell — Supabase Auth (passwordless magic-link).
 *
 * Thin wrapper over supabase.auth. Every call no-ops gracefully when Supabase
 * isn't configured (design-preview mode), so the UI keeps working without a
 * backend. Goes fully live the moment VITE_SUPABASE_URL / ANON_KEY are set.
 */
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface AuthUser {
  id: string;
  email: string | null;
}

/** Send a one-tap magic link. Redirects back to /verify to complete sign-in. */
export async function sendMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const sb = getSupabase();
  if (!sb) return { ok: false, error: "unconfigured" };
  const { error } = await sb.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/verify` },
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

/** Current signed-in user (or null). */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  const u = data.session?.user;
  return u ? { id: u.id, email: u.email ?? null } : null;
}

/** Subscribe to sign-in / sign-out. Returns an unsubscribe fn. */
export function onAuthChange(cb: (user: AuthUser | null) => void): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};
  const { data } = sb.auth.onAuthStateChange((_event, session) => {
    const u = session?.user;
    cb(u ? { id: u.id, email: u.email ?? null } : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signOut(): Promise<void> {
  const sb = getSupabase();
  if (sb) await sb.auth.signOut();
}

export { isSupabaseConfigured };
