import { Router, Response } from 'express';
import { db } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../auth';
import { Category } from '../../src/types';

const router = Router();

// GET /api/categories
router.get('/', authMiddleware, (_req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const categoriesWithCounts = rawData.categories.map((c) => ({
    ...c,
    productCount: rawData.products.filter((p) => p.categoryId === c.id).length,
  }));
  res.json({ success: true, data: categoriesWithCounts });
});

// POST /api/categories (Admin only)
router.post('/', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const { name, description, icon, color } = req.body;
  if (!name || !String(name).trim()) {
    res.status(400).json({ success: false, message: 'نام دسته‌بندی الزامی است.' });
    return;
  }

  const rawData = db.getRawData();
  const newCat: Category = {
    id: `cat-${Date.now()}`,
    name: String(name).trim(),
    description: description || '',
    icon: icon || 'Tag',
    color: color || '#f59e0b',
  };

  rawData.categories.push(newCat);
  db.commit();
  res.status(201).json({ success: true, data: newCat });
});

// PUT /api/categories/:id (Admin only)
router.put('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.categories.findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد.' });
    return;
  }

  const { name, description, icon, color } = req.body;
  rawData.categories[index] = {
    ...rawData.categories[index],
    name: name !== undefined ? String(name).trim() : rawData.categories[index].name,
    description: description !== undefined ? description : rawData.categories[index].description,
    icon: icon !== undefined ? icon : rawData.categories[index].icon,
    color: color !== undefined ? color : rawData.categories[index].color,
  };

  db.commit();
  res.json({ success: true, data: rawData.categories[index] });
});

// DELETE /api/categories/:id (Admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), (req: AuthRequest, res: Response): void => {
  const rawData = db.getRawData();
  const index = rawData.categories.findIndex((c) => c.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ success: false, message: 'دسته‌بندی یافت نشد.' });
    return;
  }

  // Check if any product uses this category
  const hasProducts = rawData.products.some((p) => p.categoryId === req.params.id);
  if (hasProducts) {
    res.status(400).json({
      success: false,
      message: 'نمی‌توانید این دسته‌بندی را حذف کنید زیرا محصولاتی به آن اختصاص دارند.',
    });
    return;
  }

  rawData.categories.splice(index, 1);
  db.commit();
  res.json({ success: true, message: 'دسته‌بندی با موفقیت حذف شد.' });
});

export default router;
