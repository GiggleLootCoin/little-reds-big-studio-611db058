import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // Keep the default provider-neutral root deployment while allowing GitHub Pages
  // to supply its project sub-path through VITE_BASE_PATH during its build.
  base: process.env.VITE_BASE_PATH || "/",
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
