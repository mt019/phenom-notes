# Engineering Log

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

- 本次只完成本機重拆、build 與視覺／互動驗收；未部署 preview，未修改正式
  `phenomcanvas.com/notes`，也未觸碰司法中譯站或 `phenom-ops`。
