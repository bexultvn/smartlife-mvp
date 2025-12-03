import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',  // Абсолютные пути для деплоя (важно для assets в dist/)
  build: {
    outDir: 'dist',
    emptyOutDir: true,  // Очищает dist перед билдом — аналог rm для Vite
    assetsDir: 'assets'
  },
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer')
      ]
    }
  },
  server: {
    port: 5173
  }
});
