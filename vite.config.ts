import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Redireciona /api/tts para o servidor local de TTS (dev)
      '/api/tts': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
