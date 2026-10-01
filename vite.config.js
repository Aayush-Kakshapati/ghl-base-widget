import { defineConfig, loadEnv } from "vite";

// Builder shell only: no React. `base: "./"` so the built files work from any
// path when HighLevel hosts the iframe.
export default defineConfig(({ mode }) => {
  const apiBaseUrl = loadEnv(mode, process.cwd(), "").VITE_API_BASE_URL;
  const apiUrl = apiBaseUrl ? new URL(apiBaseUrl) : null;
  const apiPath = apiUrl?.pathname.replace(/\/+$/, "") || "";

  return {
    base: "./",
    server: {
      port: 5174,
      proxy: apiUrl
        ? {
            "/__api": {
              target: apiUrl.origin,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/__api/, apiPath),
            },
          }
        : undefined,
    },
  };
});
