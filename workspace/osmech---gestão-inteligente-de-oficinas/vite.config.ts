/// <reference types="vitest" />
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        strictPort: true, // Impede mudança automática de porta
        host: '0.0.0.0',
        hmr: {
          protocol: 'ws',
          host: 'localhost',
          port: 3001,
          clientPort: 3001, // Força cliente a usar porta correta
        },
        watch: {
          usePolling: true,
        },
        proxy: {
          '/api': {
            target: 'http://localhost:8000',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Evita erro "process is not defined" no navegador
        'process.env.NODE_ENV': JSON.stringify(mode),
      },
      // Otimizações para evitar erros de build
      optimizeDeps: {
        include: ['react', 'react-dom', 'recharts', 'html2canvas', 'jspdf'],
        exclude: ['@testing-library/react']
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
          '@components': path.resolve(__dirname, './src/components'),
          '@hooks': path.resolve(__dirname, './src/hooks'),
          '@contexts': path.resolve(__dirname, './src/contexts'),
          '@services': path.resolve(__dirname, './src/services'),
          '@utils': path.resolve(__dirname, './src/utils'),
          '@types': path.resolve(__dirname, './src/types'),
          '@schemas': path.resolve(__dirname, './src/schemas'),
        }
      },
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        testTimeout: 10000,
        hookTimeout: 10000,
        pool: 'forks',
        poolOptions: {
          forks: {
            singleFork: true,
          },
        },
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/',
            'src/test/',
            '**/*.d.ts',
            '**/*.config.*',
            '**/index.ts',
          ],
        },
      },
    };
});
