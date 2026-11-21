# GitHub Copilot 專案指示

## 技術限制

- 這是純前端專案，只使用 HTML、CSS 與原生 JavaScript。
- 禁止引入任何框架或套件。
- 不要建立 `package.json`，不要執行 `npm install`。
- 不要引用外部 CDN，專案必須能完全離線運作。
- 檔案結構固定為根目錄的 `index.html`、`styles.css` 與 `app.js`。

## 程式風格

- 程式碼註解一律使用繁體中文。
- 變數與函式命名使用英文 camelCase。
- CSS 顏色一律使用 `:root` 中定義的 CSS 變數，不要直接寫入色碼。
- JavaScript 使用 `const` 或 `let` 宣告，不要使用 `var`。
- 產生 DOM 內容時，使用 `textContent` 或 `createElement`，不要使用 `innerHTML` 組合字串。

## 協作方式

- 動手修改前，先條列說明計畫修改的檔案與變動內容，等待使用者確認後再開始。
- 一次只處理一件事，不要順手進行使用者未要求的重構。
- 修改完成後，說明如何在瀏覽器中驗證結果。
