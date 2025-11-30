import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from 'nitro/vite'
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
    }),
    react(),
    tailwindcss(),
    nitro(),
  ],
  nitro: {},
  build: {
    chunkSizeWarningLimit: 600
  }
});
