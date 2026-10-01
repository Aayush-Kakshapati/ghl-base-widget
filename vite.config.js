import { defineConfig } from "vite";

// Builder shell only: no React. `base: "./"` so the built files work from any
// path when HighLevel hosts the iframe.
export default defineConfig({
  base: "./",
  server: {
    port: 5174,
  },
});
