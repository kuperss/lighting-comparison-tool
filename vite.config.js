import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 用相對路徑：放在 https://帳號.github.io/任何repo名稱/ 或自訂網域都不用改設定
export default defineConfig({
  base: './',
  plugins: [react()],
  // 產品資料直接打包進 JS（gzip 後約 150KB），不另外拆檔
  build: { chunkSizeWarningLimit: 1000 },
  // 單元測試只跑 scripts/；e2e/ 由 Playwright 執行
  test: { include: ['scripts/**/*.test.mjs'] },
});
