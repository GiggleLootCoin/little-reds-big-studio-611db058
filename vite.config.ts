import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // The Studio is deployed at the origin root. Keep the asset base provider-neutral
  // so the app works on the documented production host and other static hosts.
  base: "/",
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    tailwindcss(),
    tsconfigPaths(),
    viteReact(),
  ],
});
