import { defineConfig, mergeConfig } from "vite"

import { tanstackViteConfig } from "@tanstack/config/vite"

const config = defineConfig({
  // Framework plugins, vitest config, etc.
})

export default mergeConfig(
  config,
  tanstackViteConfig({
    entry: `./src/lib/electric.ts`,
    srcDir: `./src`,
  })
)
