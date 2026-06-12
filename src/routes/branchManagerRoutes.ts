import { Router } from 'express';
import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { verifyToken, requireRole, requireBranch } from '../middleware/auth.js';

const router = Router();
router.use(verifyToken, requireRole(['BRANCH_MANAGER']), requireBranch);

router.get('/overview', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const branch = await prisma.branch.findUnique({
    where:   { id: branchId },
    include: { _count: { select: { orders: true, users: true, tables: true } } },
  });
  res.json(branch);
});

router.get('/orders', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const orders = await prisma.order.findMany({
    where:   { branchId },
    include: { items: { include: { menuItem: true } }, customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(orders);
});

router.get('/staff', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const staff = await prisma.user.findMany({
    where:  { branchId, role: { in: ['CHEF', 'CASHIER', 'BRANCH_MANAGER'] } },
    select: { id: true, name: true, role: true, salary: true, isActive: true },
  });
  res.json(staff);
});

router.get('/bookings', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const bookings = await prisma.booking.findMany({
    where:   { table: { branchId } },
    include: {
      customer: { select: { name: true } },
      table:    { select: { tableNumber: true } },
    },
    orderBy: { date: 'asc' },
  });
  res.json(bookings);
});

router.get('/sales', async (req: Request, res: Response) => {
  const branchId = req.user!.branchId!;
  const result = await prisma.order.aggregate({
    where: { branchId, status: { in: ['DONE', 'DELIVERED'] } },
    _sum:   { total: true },
    _count: { id: true },
  });
  res.json({ totalSales: result._sum.total ?? 0, orderCount: result._count.id });
});

export default router;
