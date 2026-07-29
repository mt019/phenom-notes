import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notes/',
  plugins: [react()],
  ssr: {
    noExternal: ['@phenomcanvas/ui'],
  },
  build: {
    target: 'es2022',
  },
});
