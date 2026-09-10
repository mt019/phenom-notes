# Engineering Log

## 2026-09-11 — 字型改由 assets.phenomcanvas.com 供應，與 court、wealth 共用快取

站主讀〈借眼〉回報字型載入很久。本機線路 230 KB/s 下 headless 實測，25 秒後常用面 2.3 MB、
其餘面 5.6 MB、Erikas Bold 710 KB 三支都還沒下載完。其餘面被抓的原因與 8/28 那條相同：
側欄每頁印全部文章標題，〈替餼羊說幾句話〉的「餼」不在常用面，82 頁裡 80 頁命中。

共用套件 v0.1.65（9/8）已把七支字型改成從 `assets.phenomcanvas.com` 以內容定址供應，
court 與 wealth 同日升版接上；本站當時在 `phenom-ops/infra/font-delivery-exceptions.json`
登記為例外，理由寫的是 8/31 已刪掉的那條字串替換產線，加上「字集重切待站主裁定」——
換投遞方式與重切字表是兩件事，前者不需要裁定。

這一次照 court `b1e5eb2` 改三個檔：`package.json` 升 v0.1.65、`src/main.jsx` 入口換
`styles-external-fonts.css`、`vite.config.js` 掛 `vite-font-preload.mjs`。產物 23.99 →
11.87 MiB，七支 phenom 字型不再進 dist；HTML 的 preload 與 CSS 的 @font-face 都指向
共用 origin，剛看過 cc 或 wealth 的讀者進本站不必重抓常用面。

`validate-build.mjs` 那條「常用面與其餘面兩個檔都要出貨」改成外部供應版：產物的 CSS 要
引到套件 manifest 登記的兩支 URL，`index.html` 要 preload 常用面。負向測試兩條實跑：
拿掉 preload 報「fontPreload plugin 沒有生效」，CSS 改掉其餘面 URL 報「沒有引到共用 URL」。

每頁仍會抓其餘面 5.6 MB，字表在共用層，是 CHECKPOINT.notes.md 字型投遞子線寫著待裁定的下一步；Erikas
兩支 1.16 MB 的子集裝了 340 個碼位，本站只用到數字與 eyebrow，也還沒有動。
## 2026-08-28 — 字型投遞：每頁多下載的 1.75 MB，與為一個 emoji 拉的 5.77 MB

### 量到什麼

headless 冷造訪，本機服務 `dist`，`/notes/why-tax-law/` 下載 6 支字型、11,121,668 bytes：
匯文明朝 ext 5,769,404、core 2,354,456、`HuiwenMincho-notes-subset` 1,789,160、
Erikas 兩面 1,190,460、Radio Newsman 18,188。側欄印著〈3🐑〉標題的頁面另加 Chiron
3,384,260，合計 14,505,928。

### 兩件壞掉的事

`public/fonts/HuiwenMincho-notes-subset.woff2` 沒有任何 `@font-face` 引用。它由
`vite.config.js` 的 plugin 接上：那支 plugin 把套件 `styles.css` 裡的
`"../fonts/HuiwenMincho-subset.woff2"` 換成本站的檔，而套件 v0.1.34 把 `styles.css` 拆成
兩行 `@import` 之後，那個字串不在被 transform 的檔案裡，`String.replace` 找不到就原樣返回。
`index.html` 仍然 preload 它，preload 不需要 CSS 引用就會發請求，於是每頁下載 1.75 MB
放著不用。當時 `validate-build.mjs` 的三條字型檢查是「檔在不在」「有沒有超過 2 MiB」
「HTML 有沒有那行 preload」，壞掉的狀態下三條全過。

套件的內文其餘面自 2026-08-17 切分以來不帶 `unicode-range`，等於宣告 U+0-10FFFF，常用面
沒有的碼位一律落到它。72 頁裡有 65 頁的側欄印著〈3🐑〉，U+1F411 不在常用面的範圍內，
每頁去取 5.77 MB，而其餘面裡沒有那隻羊，瀏覽器仍然落回系統 emoji。這份宣告由九個站共用。

### 改法

`@phenomcanvas/ui` v0.1.63 給其餘面補上 `unicode-range: U+3400-4DBF, U+4E00-9FFF,
U+F900-FAFF`。宣告成三個漢字區塊而不逐字列出：其餘面實測只含漢字（8,644 個碼位），逐字
要 4,535 段、40 KB 的 CSS 進每一頁。區塊裡 Huiwen 畫不出的碼位由 Chiron 那一面接走（宣告
在後，17,140 個碼位），兩者都沒有的剩 143 個相容漢字。`validate-font-subsets.mjs` 加一條
驗宣告涵蓋得住其餘面實際含有的每個碼位，驗涵蓋不驗相等：宣告可以比內容寬，比它窄的話
那些字會掉到堆疊下一個字型，同一句話兩種字面而沒有東西會報。

v0.1.64 的 `scripts/lib/font-delivery.mjs` 驗兩件事：產物裡每個字型檔都要出現在某一份
CSS 裡，每個 `as="font"` 的 preload 都要指向被引用的檔。掃到零份 CSS 或零份 HTML 也報。
本站升到 v0.1.64，刪掉 `public/fonts/`、`index.html` 的 preload 與那個 plugin，
`validate-build.mjs` 改為呼叫共用層，不留第二份判定。

負向測試四條各實跑到失敗訊息：拿掉 `unicode-range`；把範圍改窄成 `U+4E00-9FFF`（報 208 個
碼位落在範圍外）；`public/` 塞一個沒人引用的字型重建；把 preload 加回 `index.html` 重建。

改後同一組頁面量到 9,332,508 bytes。

### 還沒解決

每頁仍取其餘面那 5.77 MB，成因換成側欄的〈替餼羊說幾句話〉——「餼」只有其餘面有。常用面
取字頻 99.9%（3,275 個漢字），而六個站的正文合計只用到 6,003 個相異漢字，其餘的全靠那一面。
實裁量過：常用面改成收下語料裡出現過的全部字元是 7,059 碼位 3.90 MB，其餘面剩 6,075 碼位
3.86 MB，本站每頁 9.33 MB 降到約 5.1 MB。代價是首屏那一面 2.25 MB 變 3.90 MB，而
2026-08-17 切成兩面的理由正是首屏要快（CLS 0.293 降到 0.002）。門檻要不要改，站主未定。

其餘八站（wealth、court、statistics、iias、tax、judicial-translations、brief、studies）
沒有字型斷言，各自 dist 帶 11.2 MB，升版並接上 `runFontDelivery` 的薄殼還沒做。
`my-canvas-lab` 另有一份拆分前的 7.94 MB 單檔子集。

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

現在從同一份匯文明朝裁出固定的手記站用子集，涵蓋現有內容、介面與共用元件，檔案降到
1.8 MB；少見缺字交給 Chiron 明體 fallback。Vite 在打包共用 UI 時直接把原字檔換成這份
子集，HTML 也會預載它，
不會先啟動完整字檔下載。build validator 會檢查每條靜態路由都有 preload、字檔存在且
不超過 2 MiB。

本機 Chromium 在 `/notes/stream/` 驗證：`document.fonts.check()` 通過，正文 computed
font-family 首選仍是 `Huiwen Mincho`；網路只取 1,789,460-byte 的站內子集，沒有再抓
8,131,032-byte 的完整字檔。
## 2026-08-01 — 補回內頁眉標的回手記按鈕

短記、舊帖和單篇文章雖然都畫了「手記」眉標，`ArticleLayout` 卻沒有把共用
`PageIdentity` 已支援的返回落點傳下去，結果只剩一行不能按的字。`phenom-ui v0.1.8`
讓 ArticleLayout、PageShell、DashboardLayout 全部傳遞 `eyebrowBack`；三種 Notes 內頁一律
連回 `/notes`，build validator 也會逐頁檢查
`aria-label="回手記"` 與正確網址。
