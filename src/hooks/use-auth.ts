import { useEffect, useState } from "react";

export type LocalUser = { id: string; email: string; user_metadata: { display_name: string } };
export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  about: string;
  avatar_url: string | null;
  banner_url: string | null;
};
const KEY = "little-reds-local-user";

function readUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!parsed || typeof parsed !== "object") return null;
    const value = parsed as Partial<LocalUser>;
    if (
      typeof value.id !== "string" ||
      typeof value.email !== "string" ||
      !value.user_metadata ||
      typeof value.user_metadata !== "object" ||
      typeof value.user_metadata.display_name !== "string" ||
      !value.user_metadata.display_name.trim()
    ) return null;
    return value as LocalUser;
  } catch {
    return null;
  }
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useAuth() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(readUser());
    setReady(true);
  }, []);
  return { session: user ? { user } : null, user, ready };
}

function readProfile(id: string): Profile {
  const user = readUser();
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(`little-reds-profile:${id}`) || "null");
    if (parsed && typeof parsed === "object") {
      const value = parsed as Partial<Profile>;
      if (
        typeof value.id === "string" && typeof value.handle === "string" &&
        typeof value.display_name === "string" && typeof value.about === "string" &&
        (value.avatar_url === null || typeof value.avatar_url === "string") &&
        (value.banner_url === null || typeof value.banner_url === "string")
      ) return value as Profile;
    }
  } catch {
    // Rebuild a safe default profile below.
  }
  return {
    id,
    handle: user?.user_metadata.display_name?.toLowerCase().replace(/\s+/g, "-") || "creator",
    display_name: user?.user_metadata.display_name || "Creator",
    about: "",
    avatar_url: null,
    banner_url: null,
  };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const load = async (id: string) => {
    setLoading(true);
    setProfile(readProfile(id));
    setLoading(false);
  };
  useEffect(() => {
    if (userId) void load(userId);
    else setProfile(null);
  }, [userId]);
  return { profile, loading, setProfile, reload: () => (userId ? load(userId) : Promise.resolve()) };
}

export function createLocalUser(displayName: string, email = "local@studio") {
  const cleanName = displayName.trim();
  if (!cleanName) throw new Error("A name is required.");
  const user: LocalUser = {
    id: createId(),
    email: email.trim() || "local@studio",
    user_metadata: { display_name: cleanName },
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  return user;
}

export function signOutLocal() {
  localStorage.removeItem(KEY);
  window.location.reload();
}
