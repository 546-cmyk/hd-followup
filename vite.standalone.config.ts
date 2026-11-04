import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function renameIndexPlugin(): Plugin {
  return {
    name: 'rename-index-html',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist/client');
      const src = path.join(outDir, 'index.standalone.html');
      const dst = path.join(outDir, 'index.html');
      if (fs.existsSync(src)) {
        fs.renameSync(src, dst);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), renameIndexPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@client': path.resolve(__dirname, 'client'),
      '@server': path.resolve(__dirname, 'server'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@lark-apaas/client-toolkit/logger': path.resolve(
        __dirname,
        'client/src/utils/logger-standalone.ts',
      ),
      '@lark-apaas/client-toolkit/utils/getAxiosForBackend': path.resolve(
        __dirname,
        'client/src/utils/getAxiosForBackend-shim.ts',
      ),
      '@lark-apaas/client-toolkit/components/UniversalLink': path.resolve(
        __dirname,
        'client/src/utils/universal-link.tsx',
      ),
    },
  },
  root: path.resolve(__dirname, 'client'),
  build: {
    outDir: path.resolve(__dirname, 'dist/client'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'client/index.standalone.html'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
