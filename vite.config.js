import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notes/',
  plugins: [
    {
      name: 'notes-huiwen-subset',
      enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('/@phenomcanvas/ui/src/styles.css')) return null;
        return code.replace(
          "../fonts/HuiwenMincho-subset.woff2",
          "/fonts/HuiwenMincho-notes-subset.woff2",
        );
      },
    },
    react(),
  ],
  ssr: {
    noExternal: ['@phenomcanvas/ui'],
  },
  build: {
    target: 'es2022',
  },
});
