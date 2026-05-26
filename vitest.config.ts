import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'packages/core',
      'packages/editor',
      'packages/plugins/narrator',
      'packages/plugins/strategist',
      'packages/plugins/reinforcements',
      'packages/plugins/remix',
    ],
  },
})
