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
- 所有內容 build-time 產生完整 HTML；不加入 React hydration、Supabase、登入或內容 API。
- 新文章不得觸發 glyph subset。完整字型之後由版本化資產來源提供，內容建置不切字。
- preview 不得使用 `main` 分支標記，不得掛正式 hostname；production 必須先通過 preview。

## 驗證

```sh
npm test
npm run build
```

建置會驗 snapshot、資料 revision、62 條現有內容路由、sitemap、canonical、JSON-LD、
文章正文與跨產品連結。文章數增加時，路由數隨 `notes.json` 自動增加，不寫死。
