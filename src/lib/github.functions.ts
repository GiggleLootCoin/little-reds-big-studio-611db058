import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Repos visible to the connected GitHub account. */
export const listRepos = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { listMyRepos } = await import("@/lib/github.server");
    return listMyRepos();
  });

/** Open issues + recent commits for one repository. */
export const getRepo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        owner: z.string().min(1).max(120),
        repo: z.string().min(1).max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { getRepoActivity } = await import("@/lib/github.server");
    return getRepoActivity(data.owner, data.repo);
  });
