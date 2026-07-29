# phenom-notes

《手記》的獨立靜態前端。內容主本在 private `mt019/phenom-notes-data`；本倉只消費
`npm run export:web` 產生的可攜 snapshot，不直接猜資料倉內部結構。

## 本機

```sh
npm install
npm run data:local
npm run build
npm run preview
```

`data:local` 預設讀同層 `../phenom-notes-data`，也可用 `NOTES_DATA_DIR=/path/to/phenom-notes-data` 指定。

部署單元獨立，但公開 canonical 永久保留在 `https://phenomcanvas.com/notes/`；
Cloudflare 邊緣路由把 `/notes/*` 交給此站，repo 邊界不改變讀者看到的網址。
建置會逐檔驗證 snapshot manifest 的 SHA-256，並把精確 data commit 寫入
`dist/deployment-manifest.json`。

前端是原 Canvas Notes React UI 的等值移植；共用殼、閱讀控制、色票／紙紋 popup、
字體與 design tokens 來自固定版本的 `@phenomcanvas/ui`。Vite 先產 client bundle，
再對每條內容路由 SSR 成完整 HTML，最後才加 hydration 保留原互動。

## 路由

- `/`：文章清單
- `/:slug`：單篇
- `/archive`：沒有各自網址的舊帖合集
- `/stream`：短記流

Pages artifact 實際放在 `dist/notes/*`，公開網址與 canonical 都維持 `/notes/*`。
根目錄只放入口轉址、404 與 deployment manifest。
