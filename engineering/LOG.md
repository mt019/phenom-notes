# Engineering Log

## 2026-08-01 — 短記更新直接進 Pages

- 正式資料現在從 `phenom-notes-data` dispatch 到 `phenom-ops`。Canvas 的 Vercel workflow
  不再 clone 私有內容，也不用為了一則短記重建整站。
- `phenom-ops` 固定當下 `phenom-notes@main` 與事件傳入的完整 data SHA；build 必須設定
  `EXPECTED_DATA_COMMIT` 且通過 clean snapshot、逐檔 SHA、前端測試與靜態 artifact 驗證。
- 資料事件會產生一個 immutable preview。remote smoke 過關後，同一份 artifact 直接送到
  Cloudflare Pages `main`；production 不再 checkout，也不再 build 第二次。
- 首次自動發布：web `2c4dd65454ab0a87b3deb8e624088c86a2b74db1`、data
  `e1ea1bbc3c8b79f65beb45f0436a7a20df3c4a29`、run `30696570015`；公開
  `https://phenomcanvas.com/notes/stream/` 與 Pages production 均顯示 37 則，最新 18:31
  「scandal」，HTML 大小同為 43,115 bytes。

## 2026-07-30 — Notes 重新拆站：保留原 Canvas UI

### 決策

- 前一版 Astro 畫面雖通過內容與路由驗證，但屬重新設計，不是原 UI 等值移植，判定不合格。
- 本次直接以 `my-canvas-lab/src/pages/Notes.jsx`、`src/pages/_notes/*` 為 UI 基準；拆站只改
  repo、snapshot、static rendering 與部署邊界。
- 共用 Dashboard／Article 殼、控制項、字體、色票／紙紋 popup、TOC、Dropdown、SectionLink、
  Prose 與返回鍵改由 `@phenomcanvas/ui v0.1.6` 提供；Notes 只保留自己的文章清單、短記與正文呈現。
- private `mt019/phenom-notes-data` 仍是內容主本。web build 只接受 schema v1、clean full SHA、
  manifest 完整檔案集合與逐檔 SHA-256；本次沿用 data
  `30966244ce3ae0f82493380853fc90786732df6f`，未改 schema 或資料內容。
- Canonical 保持 `https://phenomcanvas.com/notes/*`。Pages artifact 也放在 `/notes/*`；
  不以拆站為理由改讀者網址。

### 實作

- Astro 頁面與手寫替代 UI 移除，改為 React Router + Vite。
- `prepare-build.mjs` 在驗證 snapshot 後才產生 gitignored browser snapshot：
  `notes.json`、`archive.json`、`stream.json`、完整文章／舊帖 HTML 與來源 revision。
- Vite 建 client bundle，再建 SSR bundle；`render-static.mjs` 對首頁、archive、stream、
  59 篇文章及 404 預先輸出完整 HTML、canonical、Open Graph、Article meta 與 JSON-LD。
- `stage-pages.mjs` 把 artifact 收進 `dist/notes/*`，並保留 root redirect、root 404、
  deployment manifest。自製唯讀 preview server 直接服務這個最終結構，避免 Vite preview
  在已 stage 的 `/notes` base 上回到 root redirect 形成循環。
- Markdown 仍在 build-time 轉成 HTML，保留 heading id、footnotes、fenced code 與
  `/notes/notes-assets/*` 路徑；hydration 不向 private repo 或內容 API 取資料。

### 共用 UI 修正

- `phenom-ui v0.1.2` 增加 `SiteHeader`、`ArticleNav` export 與跨 origin 返回導覽。
- `v0.1.4` 修正 `useFontScale` SSR hydration：server／client 首幀都從 100% 開始，
  mount 後才載入 storage，避免保存 110% 時 React 丟棄 server HTML。
- `v0.1.5` 固定返回鍵互動：桌面預設隱形，父區 hover／自身 hover／focus-visible 才顯示；
  觸控第一次點左上角只顯示、不導覽，之後單擊回 `https://phenomcanvas.com/`，雙擊回
  `https://phenomcanvas.com/all`。Notes 未複製這套 CSS／狀態。
- 重拆第一輪漏接原站 favicon；`v0.1.6` 把 `phenom-ring.svg` 納入共用資產。Notes build
  從 package 複製到 public／Pages root，並以
  `20c617f5d4778b6632182f63c5bd93546c047cca533cf6f96b332359b086fb5e` 驗 SHA-256，
  HTML 恢復 `<link rel="icon" href="/phenom-ring.svg">`。

### 本機驗收

- `npm test`：4/4 通過。
- `npm run build`：snapshot 82 檔驗證通過；62 條內容路由 + 404 均產生；153 檔，
  artifact 21.80 MiB（含完整共用 web fonts 與 favicon）。
- build validator：62 條內容路由、完整正文 marker、canonical、JSON-LD、sitemap 精確集合、
  跨產品連結邊界全部通過。
- Desktop 1440×1000 與 mobile 390×844 對照 Canvas 原頁：殼、字體、欄寬、清單、TOC、
  閱讀控制與 popup 一致；兩種 viewport 均無水平溢位。
- tag 搜尋／選取更新 `?tag=` 並正確篩選；字級 110%、文章 TOC、外觀 popup、archive、
  stream 與 build-time 正文均通過。
- saved font scale = 1.1 時 hydration 0 error，mount 後仍顯示 110%。
- 觸控返回鍵初始 opacity 0；第一次 tap 後顯示且 URL 不變；之後 single 到首頁、
  double 到 `/all`，console 0 error。
- preview smoke：`/notes/`、archive、stream、單篇皆 200；不存在路由回正式 Notes 404（404）。

### 部署狀態

- Web `6ff89dd1e6defeb74fab54f29023a35578fcaab2` 與 data
  `30966244ce3ae0f82493380853fc90786732df6f` 的 immutable preview：
  `https://a9d4845a.phenom-notes.pages.dev`，主要 route、favicon 與 404 smoke 通過。
- Preview 保存以兩個完整 SHA 命名的 `dist` artifact；production run
  `30489086259` 直接 promotion，沒有重新 checkout data、install frontend 或 build，
  22 秒完成（舊式完整 production 約 60–78 秒）。
- `my-canvas-lab` commit `1909a101d2726d21994869592b1e30b8daba563b` 只增加 Vercel
  external rewrite，把 `phenomcanvas.com/notes` 與 `/notes/*` 代理到獨立 Pages
  `/notes/*`；瀏覽器網址與 canonical 不變。
- Cutover 後 `https://phenomcanvas.com/notes/` 與 Pages production HTML SHA-256
  完全相同；首頁、單篇、archive、stream 回 200，未知 slug 回 404。
## 2026-08-01 — 匯文明朝不要讓讀者等四十秒

新站雖然沿用 Canvas 的 `--font-body`，首屏卻沒有預載中文字體。共用 UI 裡那份匯文明朝
又有 8.1 MB；從 Pages 第一次下載實測約 40 秒，這段時間瀏覽器只能先顯示替代字體。

現在每次 build 都從當次固定的資料 snapshot、手記介面與共用元件收集實際字元，再從同一份
匯文明朝裁出手記專用子集，檔案目前降到 1.8 MB。Vite 在打包共用 UI 時直接把原字檔換成
這份子集，HTML 也會預載它，
不會先啟動完整字檔下載。build validator 會檢查每條靜態路由都有 preload、字檔存在且
不超過 2 MiB。

本機 Chromium 在 `/notes/stream/` 驗證：`document.fonts.check()` 通過，正文 computed
font-family 首選仍是 `Huiwen Mincho`；網路只取 1,789,460-byte 的站內子集，沒有再抓
8,131,032-byte 的完整字檔。
