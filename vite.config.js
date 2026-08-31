import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/notes/',
  // 字型由 @phenomcanvas/ui 的 fonts-local.css 出貨，本站不另外裁子集。2026-08-01 到
  // 08-28 之間這裡有一個 plugin，把套件的字型網址換成本站的固定子集；套件 v0.1.34 把
  // styles.css 拆成兩行 @import 之後，那個字串不在被 transform 的檔案裡，String.replace
  // 找不到就原樣返回，替換靜默失效，於是每一頁多下載一份 1.75 MB 而沒有任何東西引用它。
  // 產物裡沒有引用的字型檔由 scripts/validate-build.mjs 擋。
  plugins: [react()],
  ssr: {
    noExternal: ['@phenomcanvas/ui'],
  },
  build: {
    target: 'es2022',
  },
});
