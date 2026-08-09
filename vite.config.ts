import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  base: "/little-reds-big-studio-611db058/",
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
