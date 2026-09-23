import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin to completely prevent Vite from reloading when data/store.json or backups change on disk
function preventDbReloadPlugin(): Plugin {
  return {
    name: 'prevent-db-reload',
    configureServer(server) {
      const dataDir = path.resolve(process.cwd(), 'data');
      const backupsDir = path.resolve(process.cwd(), 'backups');
      const serverDir = path.resolve(process.cwd(), 'server');

      // Explicitly unwatch database and backup files
      if (server.watcher && typeof server.watcher.unwatch === 'function') {
        server.watcher.unwatch([
          dataDir,
          path.join(dataDir, '**'),
          path.join(dataDir, 'store.json'),
          backupsDir,
          path.join(backupsDir, '**'),
          serverDir,
          path.join(serverDir, '**'),
          '**/*.json',
        ]);
      }

      // Intercept and swallow full-reload WebSocket broadcasts for database files
      if (server.ws && typeof server.ws.send === 'function') {
        const originalSend = server.ws.send.bind(server.ws);
        server.ws.send = function (payload: any) {
          if (payload && typeof payload === 'object') {
            if (payload.type === 'full-reload') {
              const p = String(payload.path || '');
              if (
                !p.includes('/src/') ||
                p.includes('data') ||
                p.includes('store.json') ||
                p.includes('backup') ||
                p.includes('server')
              ) {
                // Drop database full-reload event
                return;
              }
            }
          }
          return originalSend(payload);
        };
      }
    },
    handleHotUpdate({ file }) {
      const p = file.replace(/\\/g, '/');
      if (
        p.includes('/data/') ||
        p.includes('/backups/') ||
        p.includes('/server/') ||
        p.endsWith('store.json') ||
        p.endsWith('.json') ||
        !p.includes('/src/')
      ) {
        // Return empty array to tell Vite: Do NOT reload the page for this file!
        return [];
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), preventDbReloadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: [
          '**/data/**',
          '**/backups/**',
          '**/*.json',
          '**/server/**',
          '**/.git/**',
          /[\/\\]data[\/\\]/,
          /[\/\\]backups[\/\\]/,
          /[\/\\]server[\/\\]/,
          /\.json$/,
          (filePath: string) => {
            const p = filePath.replace(/\\/g, '/');
            return (
              p.includes('/data/') ||
              p.includes('/backups/') ||
              p.includes('/server/') ||
              p.endsWith('.json')
            );
          },
        ],
      },
    },
  };
});
