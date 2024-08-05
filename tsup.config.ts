import { defineConfig } from "tsup";

export default defineConfig((options) => {
  return {
    bundle: true,
    clean: true,
    dts: true,
    entry: [
      "src/index.ts",
    ],
    format: ["cjs"],
    minify: false,
    sourcemap: false,
  }
});
