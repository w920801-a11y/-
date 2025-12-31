
import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    // 讓 Vercel 的環境變數可以透過 process.env 在程式碼中讀取
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});
