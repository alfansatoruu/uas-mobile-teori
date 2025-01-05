import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Alias @ untuk mengarah ke folder src
    },
  },
  build: {
    // Jika diperlukan, dapat menambahkan pengaturan untuk build
    outDir: 'dist', // Pastikan folder output adalah 'dist'
    sourcemap: true, // Aktifkan sourcemaps jika diperlukan untuk debugging
  },
});
