import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify('test') },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    env: { TZ: 'Europe/Paris' },
    coverage: {
      provider: 'v8',
      include: ['src/domain/**'],
      exclude: ['src/domain/**/*.test.ts', 'src/domain/presets.ts', 'src/domain/types.ts'],
      thresholds: { lines: 90, branches: 85 },
    },
  },
})
