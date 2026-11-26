import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages publica en https://alexf18-developer.github.io/2005studio/ → base '/2005studio/'.
// Para Firebase Hosting u otro dominio propio: VITE_BASE=/ npm run build
export default defineConfig({
  base: process.env.VITE_BASE || '/2005studio/',
  plugins: [react()],
  server: { port: 5173, open: true },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
