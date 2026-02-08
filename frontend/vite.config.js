import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: false
  },
  resolve: {
    alias: {
      'vite': 'vite'
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://clawquest.vercel.app/api')
  }
});
