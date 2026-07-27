import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getMyProfile from "./tools/get-my-profile";
import getSession from "./tools/get-session";
import listMySessions from "./tools/list-my-sessions";
import listSpotlightTracks from "./tools/list-spotlight-tracks";
import saveSession from "./tools/save-session";

// The OAuth issuer must be the direct Supabase host: SUPABASE_URL is rewritten to
// a proxy on publish, and the project ref is the only value that survives unchanged.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "little-reds-big-studio",
  title: "Little Red's Big Studio",
  version: "1.0.0",
  instructions:
    "Tools for Little Red's Big Studio, a music-video production suite. Use list_my_sessions and get_session to read the creator's saved sessions, save_session to write lyrics, critiques or storyboards back into the studio, get_my_profile for their creator profile, and list_spotlight_tracks to browse the public Artist Spotlight feed. Always write lyrics and storyboards in the creator's own voice and save them with save_session so they appear in the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [listMySessions, getSession, saveSession, getMyProfile, listSpotlightTracks],
});
