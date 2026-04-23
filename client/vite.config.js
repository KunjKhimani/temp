import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // remove root setting
  // build: {
  //   outDir: "dist", // relative to root, default is fine
  // },
  // esbuild: {
  //   loader: "jsx",
  //   include: /src\/.*\.jsx?$/,
  // },
  // test: {
  //   globals: true,
  //   environment: "jsdom",
  //   setupFiles: "./src/setupTests.js",
  // },
});
