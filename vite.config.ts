import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // mybagpro.jp/app/ サブディレクトリに配置
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        mybagpro: resolve(__dirname, 'mybagpro.html'),
        mybagproPros: resolve(__dirname, 'mybagpro-pros.html'),
        mybagproArticles: resolve(__dirname, 'mybagpro-articles.html'),
        golfidCreate: resolve(__dirname, 'golfid-create.html'),
        golfidDiagnosis: resolve(__dirname, 'golfid-diagnosis.html'),
        golfidPublic: resolve(__dirname, 'golfid-public.html'),
      },
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          motion: ['framer-motion'],
          ai: ['@google/generative-ai'],
        },
      },
    },
  },
  server: {
    host: true,
  },
})
