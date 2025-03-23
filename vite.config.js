import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~scss': path.resolve(__dirname, './src/scss')
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx'] 
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['bootstrap', 'react-bootstrap'],
        },
      },
    },
    sourcemap: false,
    minify: 'terser',
  },
  server: {
    proxy: {
      '/api': 'http://localhost:4047',
      '/auth': 'http://localhost:4047'
    }
  }
});
