# 手記字體子集

`HuiwenMincho-notes-subset.woff2` 是從 `@phenomcanvas/ui` v0.1.6 所附的
`HuiwenMincho-subset.woff2` 再裁出的手記站專用子集。`npm run build` 每次都會從當次固定的
資料 snapshot、手記前端與共用 UI 重建它，避免新文章出現子集沒有的字，也避免首頁為一套
中文字體先下載 8.1 MB。原字體的來源與授權說明見 UI 套件的 `fonts/SOURCE-NOTES.md` 與
`fonts/LICENSES.md`。
