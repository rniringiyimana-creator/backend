import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['CASHIER']), requireBranch);

router.post('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const { customerId, bookingId, items } = req.body as {
    customerId?: number;
    bookingId?:  number;
    items: { menuItemId: number; quantity: number }[];
  };

  if (!items || items.length === 0) {
    res.status(400).json({ error: 'At least one item is required.' });
    return;
  }

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map(i => i.menuItemId) }, branchId },
  });

  if (menuItems.length !== items.length) {
    res.status(400).json({ error: 'One or more menu items are invalid for this branch.' });
    return;
  }

  const priceMap = Object.fromEntries(menuItems.map((m: { id: number; price: number }) => [m.id, m.price])) as Record<number, number>;
  const total    = items.reduce((sum, i) => sum + (priceMap[i.menuItemId] ?? 0) * i.quantity, 0);

  const order = await prisma.order.create({
    data: {
      branchId,
      customerId: customerId ?? null,
      bookingId:  bookingId  ?? null,
      total,
      items: {
        create: items.map(i => ({
          menuItemId: i.menuItemId,
          quantity:   i.quantity,
          unitPrice:  priceMap[i.menuItemId] ?? 0,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  res.status(201).json(order);
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where:   { branchId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.patch('/orders/:id/deliver', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const id = parseInt(String(req.params['id'] ?? '0'), 10);

  const order = await prisma.order.findUnique({ where: { id } });

  if (!order || order.branchId !== branchId) {
    res.status(403).json({ error: 'Order not found in your branch.' });
    return;
  }

  const updated = await prisma.order.update({
    where: { id },
    data:  { status: 'DELIVERED' },
  });
  res.json(updated);
});

export default router;
