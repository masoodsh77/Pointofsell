import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Plugin to prevent Vite from reloading the browser when database or backup files change
function preventDbReloadPlugin() {
  return {
    name: 'prevent-db-reload',
    configureServer(server: any) {
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

      // Intercept and swallow full-reload WebSocket broadcasts for non-source files
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
    handleHotUpdate({ file }: { file: string }) {
      const p = file.replace(/\\/g, '/');
      if (
        p.includes('/data/') ||
        p.includes('/backups/') ||
        p.includes('/server/') ||
        p.endsWith('store.json') ||
        p.endsWith('.json') ||
        !p.includes('/src/')
      ) {
        return [];
      }
    },
  };
}

// Routes
import authRoutes from './server/routes/auth';
import productsRoutes from './server/routes/products';
import categoriesRoutes from './server/routes/categories';
import inventoryRoutes from './server/routes/inventory';
import purchasesRoutes from './server/routes/purchases';
import salesRoutes from './server/routes/sales';
import customersRoutes from './server/routes/customers';
import suppliersRoutes from './server/routes/suppliers';
import reportsRoutes from './server/routes/reports';
import usersRoutes from './server/routes/users';
import rolesRoutes from './server/routes/roles';
import backupRoutes from './server/routes/backup';
import settingsRoutes from './server/routes/settings';
import accountingRoutes from './server/routes/accounting';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Middlewares
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/purchases', purchasesRoutes);
  app.use('/api/sales', salesRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/suppliers', suppliersRoutes);
  app.use('/api/accounting', accountingRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/backup', backupRoutes);
  app.use('/api/settings', settingsRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Global API Error Handler
  app.use('/api', (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'خطای غیرمنتظره در سرور رخ داده است.',
    });
  });

  // Vite middleware in dev, static files in production
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      plugins: [preventDbReloadPlugin()],
      server: {
        middlewareMode: true,
        watch: {
          ignored: (filePath: string) => {
            const p = filePath.replace(/\\/g, '/');
            return (
              p.includes('/data/') ||
              p.includes('/backups/') ||
              p.includes('/server/') ||
              p.endsWith('store.json') ||
              p.endsWith('.json') ||
              p.includes('/dist/') ||
              p.includes('/node_modules/') ||
              p.includes('/.git/')
            );
          },
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 سیستم مدیریت فروشگاه آجیل و خشکبار روی پورت ${PORT} آماده به کار است.`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
