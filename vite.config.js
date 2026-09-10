import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fontPreload from '@phenomcanvas/ui/scripts/vite-font-preload.mjs';

export default defineConfig({
  base: '/notes/',
  // 字型走 assets.phenomcanvas.com（styles-external-fonts.css），@font-face 指向以內容定址的
  // 共用 URL，與 court、wealth 共用同一份瀏覽器快取；preload 由建置從套件的 manifest 注入，
  // 不寫死在 index.html。2026-08-01 到 08-28 之間這裡有一個 plugin 把套件的字型網址換成本站
  // 的固定子集，套件 v0.1.34 拆檔後替換靜默失效，每頁多下載 1.75 MB 沒人引用；8/31 刪掉，
  // 產物裡沒有引用的字型檔由 scripts/validate-build.mjs 擋。
  plugins: [react(), fontPreload()],
  ssr: {
    noExternal: ['@phenomcanvas/ui'],
  },
  build: {
    target: 'es2022',
  },
});
