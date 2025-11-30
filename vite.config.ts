import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      sitemap: {
        enabled: true,
        host: "https://splitzen.vercel.app/",
      },
      spa: {
        prerender: { enabled: true, crawlLinks: true },
        enabled: true,
      },
    }),
    react(),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 600
  }
});
