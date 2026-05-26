import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@quest-editor/core': path.resolve(__dirname, '../../core/src'),
      '@quest-editor/editor': path.resolve(__dirname, '../../editor/src'),
    },
  },
  test: {
    globals: true,
  },
})
