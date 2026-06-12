import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { seed } from './lib/seed.js';

import authRoutes          from './routes/authRoutes.js';
import adminRoutes         from './routes/adminRoutes.js';
import hqRoutes            from './routes/hqRoutes.js';
import branchManagerRoutes from './routes/branchManagerRoutes.js';
import chefRoutes          from './routes/chefRoutes.js';
import cashierRoutes       from './routes/cashierRoutes.js';
import customerRoutes      from './routes/customerRoutes.js';
import menuRoutes          from './routes/menuRoutes.js';
import publicRoutes        from './routes/publicRoutes.js';

const app  = express();
const PORT = process.env['PORT'] ?? 3001;

app.use(cors({ origin: process.env['FRONTEND_URL'] ?? 'http://localhost:5173' }));
app.use(express.json());
app.use(logger);

app.use('/api/auth',           authRoutes);
app.use('/api/admin',          adminRoutes);
app.use('/api/hq',             hqRoutes);
app.use('/api/branch-manager', branchManagerRoutes);
app.use('/api/chef',           chefRoutes);
app.use('/api/cashier',        cashierRoutes);
app.use('/api/customer',       customerRoutes);
app.use('/api/menu',           menuRoutes);
app.use('/api/public',         publicRoutes);

// Simple health endpoint for external tools (Postman, curl)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, async () => {
  await seed();
  console.log(`Steakz API running on http://localhost:${PORT}`);
});
