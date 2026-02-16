import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist/js",
    emptyOutDir: false,
    lib: {
      entry: "src/map.js",
      name: "GoradosMap",
      formats: ["iife"],
      fileName: () => "map.js",
    },
    rollupOptions: {
      external: ["jquery"],
      output: {
        globals: {
          jquery: "$",
        },
      },
    },
  },
});
