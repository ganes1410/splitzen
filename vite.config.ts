import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
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
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("recharts")) return "recharts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react") && !id.includes("router"))
            return "react-vendor";
        },
      },
    },
  },
});
