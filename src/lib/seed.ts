import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

const BRANCHES = [
  { name: 'René City Centre',        address: '1 Main Street, City Centre' },
  { name: 'The Northside Cut',       address: '45 North Ave, Northside' },
  { name: 'Southgate Prime',         address: '88 South Road, Southgate' },
  { name: 'East Quarter Smokehouse', address: '12 East Lane, East Quarter' },
  { name: 'Westfield Reserve',       address: '200 West Mall, Westfield' },
  { name: 'Marina Bay Grill',        address: '9 Marina Blvd, Marina Bay' },
  { name: 'Uptown Ember',            address: '77 Uptown Drive, Uptown' },
];

const RENAMES: Record<string, string> = {
  'Steakz City Centre':  'René City Centre',
  'Steakz Northside':    'The Northside Cut',
  'Steakz Southgate':    'Southgate Prime',
  'Steakz East Quarter': 'East Quarter Smokehouse',
  'Steakz Westfield':    'Westfield Reserve',
  'Steakz Marina Bay':   'Marina Bay Grill',
  'Steakz Uptown':       'Uptown Ember',
};

export async function seed() {
  const email    = process.env['ADMIN_EMAIL']    ?? 'admin@steakz.com';
  const password = process.env['ADMIN_PASSWORD'] ?? 'admin123';

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing) {
    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name: 'System Admin', email, password: hashed, role: 'ADMIN' },
    });
    console.log(`[Seeder] Admin created: ${email}`);
  } else {
    console.log('[Seeder] Admin already exists - skipping.');
  }

  for (const [oldName, newName] of Object.entries(RENAMES)) {
    const old = await prisma.branch.findUnique({ where: { name: oldName } });
    if (old) {
      await prisma.branch.update({ where: { id: old.id }, data: { name: newName } });
      console.log(`[Seeder] Branch renamed: ${oldName} → ${newName}`);
    }
  }

  for (const b of BRANCHES) {
    let branch = await prisma.branch.findUnique({ where: { name: b.name } });
    if (!branch) {
      branch = await prisma.branch.create({ data: b });
      console.log(`[Seeder] Branch created: ${b.name}`);
    }

    const existingTables = await prisma.table.findMany({ where: { branchId: branch.id } });
    if (existingTables.length === 0) {
      const tableData = Array.from({ length: 6 }, (_, index) => ({
        tableNumber: index + 1,
        capacity: index < 2 ? 2 : index < 4 ? 4 : 6,
        branchId: branch!.id,
      }));
      await prisma.table.createMany({ data: tableData });
      console.log(`[Seeder] Tables created for branch: ${b.name}`);
    }

    const existingMenuItems = await prisma.menuItem.findMany({ where: { branchId: branch.id } });
    if (existingMenuItems.length === 0) {
      const items = [
        { name: 'Garlic Butter Shrimp', description: 'Tiger prawns with garlic, lemon, and parsley', price: 12.5, category: 'Starters' },
        { name: 'Truffle Parmesan Fries', description: 'Crispy fries tossed with truffle oil and parmesan', price: 8.75, category: 'Starters' },
        { name: 'Roasted Beet & Goat Cheese Salad', description: 'Seasonal greens, honey-roasted beets, walnuts, and goat cheese', price: 9.5, category: 'Starters' },
        { name: 'Charred Brussels Sprouts', description: 'Spiced sprouts, pecans, and a honey glaze', price: 8.25, category: 'Starters' },
        { name: 'Wild Mushroom Soup', description: 'Creamy porcini and button mushroom bisque', price: 7.75, category: 'Starters' },
        { name: 'Signature Ribeye', description: 'Char-grilled ribeye with rosemary butter and roasted veggies', price: 27.99, category: 'Mains' },
        { name: 'Herb-Roasted Chicken', description: 'Juicy chicken breast with garlic mashed potatoes and broccolini', price: 21.5, category: 'Mains' },
        { name: 'Pan-Seared Salmon', description: 'Citrus glazed salmon with asparagus and wild rice', price: 24.0, category: 'Mains' },
        { name: 'Smoked Short Rib Pappardelle', description: 'Rich tomato ragu with melted parmesan', price: 23.5, category: 'Mains' },
        { name: 'Steakhouse Burger', description: 'Angus beef, cheddar, caramelized onions, and fries', price: 18.25, category: 'Mains' },
        { name: 'Loaded Mac & Cheese', description: 'Three-cheese pasta baked with crispy breadcrumbs', price: 11.75, category: 'Sides' },
        { name: 'Grilled Asparagus', description: 'Asparagus spears with lemon & parmesan', price: 7.95, category: 'Sides' },
        { name: 'Molten Chocolate Cake', description: 'Warm chocolate cake with vanilla ice cream', price: 8.95, category: 'Desserts' },
        { name: 'Classic Creme Brulee', description: 'Creamy vanilla custard with caramelized sugar', price: 7.75, category: 'Desserts' },
        { name: 'Vanilla Panna Cotta', description: 'Silky custard with mixed berry compote', price: 7.25, category: 'Desserts' },
        { name: 'House Red Wine', description: 'Glass of our chef-selected red wine', price: 9.0, category: 'Drinks' },
        { name: 'Sparkling Lemonade', description: 'Refreshing citrus soda with mint', price: 5.25, category: 'Drinks' },
        { name: 'Espresso Martini', description: 'Coffee-flavored cocktail with vodka and espresso', price: 11.0, category: 'Drinks' },
        { name: 'Pear Ginger Fizz', description: 'Sparkling pear soda with ginger and lime', price: 6.5, category: 'Drinks' },
      ];

      await prisma.menuItem.createMany({
        data: items.map(item => ({ ...item, branchId: branch!.id })),
      });
      console.log(`[Seeder] Menu items created for branch: ${b.name}`);
    }
  }
}
