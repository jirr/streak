import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { BASE_PATH } from './app.config.ts'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as {
  version: string
}

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [react()],
})
