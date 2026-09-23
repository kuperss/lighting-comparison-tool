# 專案記憶：舞光燈具規格比較網站

給之後接手的 AI 助理（Claude Code、Codex、Cursor 等）看。使用者以**繁體中文**溝通；需要使用者確認的事項，**一律用選項讓使用者選擇**（Claude Code 用 AskUserQuestion），不要只丟開放式問題。

這份是專案記憶的主檔；專案有重要變更或使用者做了新決定時，請更新本檔。

## 現況（2026-09-23）

- **網站：** https://kuperss.github.io/lighting-comparison-tool/ ，推到 `main` 就會由 GitHub Actions（`.github/workflows/deploy.yml`）自動測試、建置、發布到 Pages。
- **技術：** React 19 + Vite 8 純靜態網站，沒有後端。畫面狀態存在網址參數：`?c=類別&m=型號,型號`、`?v=list&c=類別`。
- **里程碑：** M1–M6 都已完成，規劃見 `docs/PLAN.md`。
- **測試：** `npm test` 跑單元測試（vitest，只含 `scripts/**/*.test.mjs`）；`npm run test:e2e` 跑 Playwright 桌機＋手機（需先 `npm run build`）。雲端環境要設 `CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`。

## 資料流程（`scripts/build-data.mjs` → `src/data/catalog.json`，產出檔不進 git）

1. **型錄**（`data/source/products-db.json`，由型錄 PDF OCR 而來）：提供牌價與型錄頁碼。
2. **官網**（`data/source/official-db.json`，由官網抓取）：
   - 提供規格、圖片、壽命、R9、驅動器、安裝方式、產品頁連結。
   - **兩邊衝突時一律以官網為準**，使用者明確要求過，不要做例外。
   - 衝突清單寫在 `data-report.md`（目前 70 筆）。
3. **官網獨有的產品：** 屬於 `categories.config.json` 裡 `officialCategories` 列出的分類才加入，牌價顯示「未列價」。
4. **人工修正：** `data/corrections.json`，合併後套用，目前是空的。

- **機型分組：** 同系列、型號只差色溫字母 W/N/D 或外觀字尾（-BK 黑、-WH 白、-LW 木紋，官網黑款有時是結尾 B），這些 SKU 算同一個機型。實作是 `scripts/lib/catalog.mjs` 的 `skeleton()`。
- **目前規模：** 6 類共 234 個機型。
  - 類別：崁燈、筒燈、投射燈/軌道燈、平板燈、吸頂燈、軟條燈。「燈管/燈座」使用者要求整類拿掉。
  - 型錄新品有 187 個型號在官網找不到，所以沒有圖片。
- **原則：** 不自行推測數值。「調光 / 控制」只依品名字樣整理；光斑直徑是依發光角度的幾何換算，不顯示照度。

## 使用者已決定的事

- **網站形式：** 單一公開網站，不分經銷商，不需登入。
- **價格：** 公開顯示型錄牌價。
- **詢價：** 不設詢價窗口，只提供「複製比較清單」和「分享連結」。
- **畫面：** 採用線框方案 2a+2b（桌機）、2c（選擇器）、2e（手機）、2g/2h（列表加入比較）、2i→2j（空狀態）。原稿在 `design/`。
- **配色：** 舞光品牌色，現行版本見 commit `3dc7298`。
  - 暖灰漸層頁頭，橘色英文小標搭配中文大標。
  - 米灰底配白色卡片，深色膠囊按鈕，品牌橘只當點綴。
  - **使用者不喜歡大面積橘色**：`4a021e7` 加重橘色的版本已被要求還原。
- **Logo：** 用 `public/logo.png`，是使用者提供的截圖處理而成（白底去背，並去掉「N」附近的光暈）。拿到原始檔要換掉。

## 還在等使用者提供

- 舞光 Logo 原始檔（SVG 或透明背景 PNG）
- 187 個型錄新品的圖片網址，放在 `data/images.csv`
- 之後的型錄或官網資料更新，照 `docs/資料更新說明.md` 替換 `data/source/` 裡的檔案

## 環境注意

- **連不到的網站：** 雲端 session 的網路政策擋住 `www.dancelight.com.tw` 和 `*.github.io`，本機預覽看不到官網圖片是正常的。
- **發布狀態：** 查 Actions 可用未驗證的 GitHub API，例如 `curl https://api.github.com/repos/kuperss/lighting-comparison-tool/actions/runs?per_page=1`。
