# phenom-notes

《手記》的獨立靜態前端。內容主本在 private `mt019/phenom-notes-data`；本倉只消費
`npm run export:web` 產生的可攜 snapshot，不直接猜資料倉內部結構。

## 本機

```sh
npm install
npm run data:local
npm run build
npm run dev
```

`data:local` 預設讀同層 `../phenom-notes-data`，也可用 `NOTES_DATA_DIR=/path/to/phenom-notes-data` 指定。
建置會逐檔驗證 snapshot manifest 的 SHA-256，並把精確 data commit 寫入
`dist/deployment-manifest.json`。

## 路由

- `/`：文章清單
- `/:slug`：單篇
- `/archive`：沒有各自網址的舊帖合集
- `/stream`：短記流

舊的 `/notes/*` 在正式切換後由 Canvas 保留永久轉址；本倉不接管舊網址。
