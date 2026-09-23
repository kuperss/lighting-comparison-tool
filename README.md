# lighting-comparison-tool

燈具規格差異比較工具：同類別最多 4 款燈具並排比較瓦數、光通量、色溫、演色性、發光角度、開孔尺寸與牌價。

- 網站：https://kuperss.github.io/lighting-comparison-tool/
- 類別：崁燈、筒燈、投射燈/軌道燈、平板燈、吸頂燈、軟條燈（可在 `data/categories.config.json` 增減）
- 技術：React + Vite 純靜態網站，由 GitHub Actions 自動發布到 GitHub Pages

## 更新產品資料

非工程人員請看 **[docs/資料更新說明.md](docs/資料更新說明.md)**。

簡單說：用新版 JSON 取代 `data/source/` 裡的型錄或官網資料庫，在 GitHub 網頁上 commit 到 `main`，約 1–2 分鐘後網站就會更新。資料有錯誤時不會發布，錯誤訊息會出現在 Actions 頁面。

## 資料檔（`data/`）

| 檔案 | 用途 |
|---|---|
| `source/products-db.json` | 型錄資料庫（牌價、型錄頁碼），型錄改版時**整份替換**（檔名固定） |
| `source/official-db.json` | 官網資料庫（規格、圖片、壽命、產品頁），官網更新時**整份替換**；兩邊衝突時**以官網為準** |
| `categories.config.json` | 網站類別 ↔ 型錄分類（`sections`）、品名關鍵字（`nameIncludes`）、官網分類（`officialCategories`） |
| `corrections.json` | 人工修正：`{ model, field, from, to, note }`，改版後仍會套用 |
| `images.json` 或 `images.csv` | 型號 → 官網圖片網址（JSON：`{"D-9DOB9N": "https://…"}`；CSV：`型號,網址`） |
| `featured.json` | 指定熱門比較（選填）：`[{ "category": "downlight", "title": "…", "models": ["…"] }]` |
| `site.config.json` | 品牌名稱、Logo 網址、最多比較款數 |

建置時的檢查：

- **停止建置：** 格式錯誤、型號重複、類別少於 2 款。
- **只提醒、照常建置：** 型錄與官網不一致的清單（已採用官網）、其他提醒與缺圖清單寫在 `data-report.md`，可在 Actions 頁面下載。

## 開發

```bash
npm install
npm run dev          # 產生資料後啟動本機預覽
npm test             # 資料轉換單元測試
npm run build        # 檢查資料 → 產生 src/data/catalog.json → 建置到 dist/
npm run test:e2e     # 瀏覽器端到端測試（桌機 + 手機，需先 build）
```

## 目錄

```
data/          產品資料與設定（見上表）
scripts/       資料檢查與轉換（build-data.mjs、lib/catalog.mjs）
src/           網站程式
e2e/           端到端測試
docs/          實作計劃、資料更新說明
design/        Claude Design 線框稿與設計對話紀錄
```
