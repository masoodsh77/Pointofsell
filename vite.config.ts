import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

// Plugin to completely prevent Vite from reloading when data/store.json or backups change on disk
function preventDbReloadPlugin(): Plugin {
  return {
    name: 'prevent-db-reload',
    handleHotUpdate({ file }) {
      const p = file.replace(/\\/g, '/');
      if (
        p.includes('/data/') ||
        p.includes('/backups/') ||
        p.includes('/server/') ||
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
