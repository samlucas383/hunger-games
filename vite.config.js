import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/@openfoodfacts/openfoodfacts-webcomponents/dist/assets/**/*",
          dest: "assets/webcomponents",
        },
      ],
    }),
  ],
  optimizeDeps: {
    exclude: ["js-big-decimal"],
  },
  build: {
    rollupOptions: {
      output: {
        // Keep heavy third-party dependencies in stable vendor chunks for better caching.
        manualChunks(id) {
          if (
            id.includes("/src/i18n/messages.js") ||
            (id.includes("/src/i18n/") && id.endsWith(".json"))
          ) {
            return "app-i18n-resources";
          }

          if (!id.includes("node_modules")) {
            return;
          }

          if (id.includes("@mui/icons-material")) {
            return "vendor-mui-icons";
          }

          if (id.includes("@mui/x-data-grid")) {
            return "vendor-mui-datagrid";
          }

          if (id.includes("@mui/lab")) {
            return "vendor-mui-lab";
          }

          if (id.includes("@mui/material") || id.includes("@emotion")) {
            return "vendor-mui-core";
          }

          if (
            id.includes("react-dom") ||
            id.includes("react-router") ||
            id.includes("/react/")
          ) {
            return "vendor-react";
          }

          if (id.includes("@tanstack/react-query")) {
            return "vendor-query";
          }

          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "vendor-i18n";
          }
        },
      },
    },
  },
});
