import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  about: string;
  avatar_url: string | null;
  banner_url: string | null;
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: (session?.user ?? null) as User | null, ready };
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, handle, display_name, about, avatar_url, banner_url")
      .eq("id", id)
      .maybeSingle();
    setProfile(data ?? null);
    setLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    void load(userId);
  }, [userId]);

  return {
    profile,
    loading,
    setProfile,
    reload: () => (userId ? load(userId) : Promise.resolve()),
  };
}
