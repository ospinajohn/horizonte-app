import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      electron: resolve(__dirname, 'src/main/test/electron-stub.ts'),
      '@electron-toolkit/utils': resolve(__dirname, 'src/main/test/electron-toolkit-utils-stub.ts')
    }
  }
})
