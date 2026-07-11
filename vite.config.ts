import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/soundmaster/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
