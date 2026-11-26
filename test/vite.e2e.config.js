// Configuración SOLO para pruebas E2E: reemplaza Firebase por la versión falsa en memoria.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const fake = (f) => fileURLToPath(new URL(`./fake-firebase/${f}.js`, import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('..', import.meta.url)),
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      'firebase/app': fake('app'),
      'firebase/auth': fake('auth'),
      'firebase/firestore': fake('firestore'),
    },
  },
  server: { port: 5199, strictPort: true },
});
