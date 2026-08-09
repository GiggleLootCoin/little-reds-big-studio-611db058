/**
 * Legacy Lovable integration intentionally retained as a no-op compatibility
 * surface. The studio no longer depends on hosted Lovable auth or Supabase.
 */
export const lovable = {
  auth: {
    signInWithOAuth: async () => ({
      error: new Error("Hosted OAuth is disabled. Little Red's Big Studio uses local/free-open operation."),
    }),
  },
};
