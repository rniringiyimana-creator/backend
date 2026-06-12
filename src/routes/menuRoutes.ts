import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();

router.get('/:branchId', async (req: Request, res: Response) => {
  const branchId = parseInt(String(req.params['branchId'] ?? '0'), 10);
  const items = await prisma.menuItem.findMany({
    where: { branchId, isAvailable: true },
    orderBy: { category: 'asc' },
  });
  res.json(items);
});

router.post(
  '/',
  verifyToken,
  requireRole(['BRANCH_MANAGER', 'ADMIN']),
  requireBranch,
  async (req: Request, res: Response) => {
    const branchId = req.user!.branchId!;
    const { name, description, price, category } = req.body as {
      name: string; description?: string; price: number; category: string;
    };

    if (!name || !price || !category) {
      res.status(400).json({ error: 'name, price and category are required.' });
      return;
    }

    const item = await prisma.menuItem.create({
      data: { name, description, price, category, branchId },
    });
    res.status(201).json(item);
  }
);

router.patch(
  '/:id',
  verifyToken,
  requireRole(['BRANCH_MANAGER', 'ADMIN']),
  requireBranch,
  async (req: Request, res: Response) => {
    const branchId = req.user!.branchId!;
    const id = parseInt(String(req.params['id'] ?? '0'), 10);

    const item = await prisma.menuItem.findUnique({ where: { id } });

    if (!item || item.branchId !== branchId) {
      res.status(403).json({ error: 'Item not found in your branch.' });
      return;
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data:  req.body,
    });
    res.json(updated);
  }
);

export default router;
