import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',  
  build: {
    outDir: 'dist',  
    emptyOutDir: true,
    assetsDir: 'assets' 
  },
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')]
    }
  },
  server: {
    port: 5173  
  }
});
