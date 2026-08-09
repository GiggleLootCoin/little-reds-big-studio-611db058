import { useEffect, useState } from "react";

export type LocalUser = { id: string; email: string; user_metadata: { display_name: string } };
export type Profile = { id: string; handle: string; display_name: string; about: string; avatar_url: string | null; banner_url: string | null };
const KEY = "little-reds-local-user";
function readUser(): LocalUser | null { if (typeof window === "undefined") return null; try { return JSON.parse(localStorage.getItem(KEY) || "null") as LocalUser | null; } catch { return null; } }
export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { let current = readUser(); if (!current) { current = { id: crypto.randomUUID(), email: "local@studio", user_metadata: { display_name: "Little Red" } }; localStorage.setItem(KEY, JSON.stringify(current)); } setUser(current); setReady(true); }, []);
  return { session: user ? { user } : null, user, ready };
}
export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null); const [loading, setLoading] = useState(false);
  const load = async (id: string) => { setLoading(true); const raw = localStorage.getItem(`little-reds-profile:${id}`); const user = readUser(); setProfile(raw ? JSON.parse(raw) : { id, handle: user?.user_metadata.display_name?.toLowerCase().replace(/\s+/g, "-") || "creator", display_name: user?.user_metadata.display_name || "Creator", about: "", avatar_url: null, banner_url: null }); setLoading(false); };
  useEffect(() => { if (userId) void load(userId); else setProfile(null); }, [userId]);
  return { profile, loading, setProfile, reload: () => userId ? load(userId) : Promise.resolve() };
}
export function createLocalUser(displayName: string, email = "local@studio") { const user: LocalUser = { id: crypto.randomUUID(), email, user_metadata: { display_name: displayName || "Creator" } }; localStorage.setItem(KEY, JSON.stringify(user)); return user; }
export function signOutLocal() { localStorage.removeItem(KEY); window.location.reload(); }
