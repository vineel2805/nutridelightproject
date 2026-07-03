import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['@mediapipe/tasks-vision'],
  },
  test: {
    environment: 'happy-dom',
    globals: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'mediapipe-sourcemap-silencer',
      enforce: 'pre',
      transform(code, id) {
        // Strip the broken sourcemap comment from MediaPipe to prevent Vite warnings
        if (id.includes('@mediapipe/tasks-vision') && id.includes('vision_bundle.mjs')) {
          return code.replace(/\/\/# sourceMappingURL=[^\n\r]+/g, '');
        }
      },
    },
  ],
})
