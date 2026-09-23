# 燈具規格比較表設計

_Started 2026-09-23 03:02 UTC_

---

## User

Wireframe the screens for 燈具規格快速比較表, 像APPLE 官網提供不同機型之間的比較那樣, 需有質感, 使用者簡單好操作, 整體網站主要風格比照舞光LED 的官方網站, 我沒有說清楚的地方可以問我

## Assistant



## Assistant

_[tool: ask_user]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

I've made 12 low-fi wireframes on one canvas. The questions came back unanswered, so I assumed the rest: downlights compared within one category, up to 3 models at once, desktop first plus a mobile version. The specs and model names are placeholders.

- **A, comparison page:** 1a side by side with a dropdown on each column (closest to the Apple approach); 1b a spec table with collapsible groups and a "只顯示差異" switch; 1c the specs shown as bars, beam-angle shapes and a colour-temperature strip; 1d a summary of which rooms suit each model, with the full specs folded underneath.
- **B, model picker:** 1e a dropdown with category tabs; 1f a full-screen picker with filters; 1g a guided three-step picker.
- **C, mobile:** 1h two columns; 1i a pinned thumbnail row with collapsible sections; 1j one model pinned as a baseline while you swipe through the others.
- **D, entry point and empty state:** 1k a compare tray that pops up from the product list; 1l an empty page with popular comparisons.

These are still black and white. The 舞光 colours and typography will go in the mid-fidelity version. Tell me which directions to combine, or send the real specs and categories if you have them.

## User

Answered — audience: 一般消費者, 室內設計師 / 建築師, 水電 / 工程商, 經銷商 / 採購, 業務人員（現場給客戶看）; categories: 崁燈, 筒燈, 投射燈 / 軌道燈, 燈管 / 燈座, 平板燈, 吸頂燈, 同類別內比較即可; count: 4 款; specs: 瓦數, 流明 / 光效, 色溫, 演色性 Ra, 發光角度, 開孔尺寸, 調光方式, 防水等級 IP, 認證（CNS / 節能標章）, 壽命 / 保固; flow: 都要，列表加入 + 比較頁可換; features: 只顯示差異, 規格分組收合, 固定頂部機型列, 光型 / 配光曲線圖, 色溫視覺化, 分享 / 列印 / 匯出 PDF, 連到產品頁 / 詢價; device: 兩者並重; screens: 比較頁主畫面, 機型選擇器, 手機版比較, 產品列表的「加入比較」, 空狀態 / 未選機型; variations: 2 種; notes: 產品類別還要有軟條燈

## Assistant

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

我已按你的回覆，在最上方新增第二輪線框（2a–2j），每個畫面各 2 種方案。調整內容如下：
- 一次最多比較 4 款。
- 類別共 7 類，已加入軟條燈，同類別內比較。
- 規格用你勾選的項目，分 4 組：光源、安裝、功能、認證與保固，不含價格。
- 你要的輔助功能都已放入：只顯示差異、分組收合、吸頂機型列、配光曲線、色溫視覺化、分享/列印/PDF、產品頁/詢價。
- 產品列表可「加入比較」，比較頁內也能直接更換機型。
- 手機版有 2 種：2e 從 4 款中點選 2 款並排；2f 是可左右滑動的表格，方便業務在現場給客戶看。

請挑選或組合方向，我再做套用舞光官網風格的中保真版。

## User

Found issues — fixing…

## Assistant

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I fixed the squeezing in the wide wireframes. The desktop wireframes now keep their full width instead of shrinking with the preview, so 分享 / 列印 / 匯出 PDF in 2a and 2b stay on one line and the 4 model dropdowns no longer touch.

One cut-off item is flagged in 2f, and it's on purpose: the column at the right edge is half hidden to show the table scrolls sideways.

## User

為何第二輪之前是空的?

## Assistant

_[tool: read_file]_

_[tool: show_html]_

_[tool: eval_js_user_view]_

那塊空白裡什麼都沒有。第二輪上方沒有任何內容，是畫布模式的檢視位置往下偏移了約 400px，所以最上面多出一段空白。

在畫面上拖曳（或捲動）就能把空白推掉；縮放或重新整理頁面也會重新定位。線框本身沒有問題，不需要修改。

## User

發光角度用這個圖像式的表達比較直觀

## Assistant

_[tool: grep]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

我把發光角度改成參考圖那種光束圖，現在交由檢查。

- **2a 比較頁：** 每款畫出光錐，左邊標 1m、2m、3m 的照度，右邊標光斑直徑，一眼看出寬光和聚光的差別。上方加了「光束圖 / 配光曲線 / 實際光影」切換，目前只畫了光束圖。
- **2b 規格表：** 每格換成小光錐，並標出 2m 的光斑直徑；點圖可看完整的照度和配光曲線。
- **2e 手機版：** 同樣換成兩款並排的小光錐。

照度和光斑直徑是我依角度估的示意數字，要換成各型號的實測值。配光曲線和實際光影要不要畫進線框，請告訴我。

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

I fixed the two layout problems the check found, and the file is back under review.

- **2a 光束圖:** labels like "1m 1600lx" no longer wrap, and each 1m / 2m / 3m label now sits on its dashed line.
- **Model dropdowns:** the dropdowns in 2a, 1a and 1h stay inside their columns, so neighbours no longer touch or overlap.

