import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/index.html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75
      }
    }
  },
  resolve: {
    alias: {
      electron: new URL('./src/main/__mocks__/electron.ts', import.meta.url).pathname
    }
  }
})
