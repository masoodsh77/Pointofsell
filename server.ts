import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

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
import backupRoutes from './server/routes/backup';
import settingsRoutes from './server/routes/settings';
import accountingRoutes from './server/routes/accounting';

async function startServer() {
  const app = express();
  const PORT = 3000;

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
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
