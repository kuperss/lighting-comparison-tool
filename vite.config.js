import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base 用相對路徑：放在 https://帳號.github.io/任何repo名稱/ 或自訂網域都不用改設定
export default defineConfig({
  base: './',
  plugins: [react()],
});
