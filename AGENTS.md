# phenom-notes

獨立 Notes 前端。內容主本永遠是 private `mt019/phenom-notes-data`；這個 repo 不收文章正文、
原始資料、token 或資料倉路徑假設。

## 固定契約

- 只消費 `phenom-notes-data` 的 `export:web` snapshot。
- 公開 canonical 固定為 `https://phenomcanvas.com/notes/`；不可因獨立部署改成子域名。
- production／preview 一律使用 clean snapshot、完整 data SHA、逐檔 SHA-256 驗證。
- `data.lock.json` 是 web-only build 的預設 data revision；資料觸發部署可用
  `EXPECTED_DATA_COMMIT` 明確覆寫，但仍須等於 snapshot manifest。
- 路由為 `/`、`/:slug`、`/archive`、`/stream`；舊 `/notes/*` 由 Canvas 在切換後永久轉址。
- 所有內容 build-time 產生完整 HTML；只 hydration 原 Canvas 已有的篩選、閱讀字級、外觀選單、
  目次與返回鍵互動，不加入 Supabase、登入或內容 API。
- UI 以 Canvas `Notes.jsx` 與 `_notes/*` 為基準，拆站只改部署／資料邊界，不重新設計。
  共用殼、控制項、字體、色票與 popup 固定從版本化 `@phenomcanvas/ui` 消費，不在本倉複製。
- 新文章不得觸發 glyph subset。完整字型之後由版本化資產來源提供，內容建置不切字。
- preview 不得使用 `main` 分支標記，不得掛正式 hostname；production 必須先通過 preview。

## 驗證

```sh
npm test
npm run build
```

建置會驗 snapshot、資料 revision、62 條現有內容路由、sitemap、canonical、JSON-LD、
文章正文與跨產品連結。文章數增加時，路由數隨 `notes.json` 自動增加，不寫死。

`npm run preview` 會直接服務最終 Pages artifact（`dist/notes/*`），不是 Vite SPA fallback。
