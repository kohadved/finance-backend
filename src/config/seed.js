require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

const SALT_ROUNDS = 10;

function seed() {
  // Clear existing data in correct order (records reference users)
  db.exec('DELETE FROM financial_records; DELETE FROM users;');

  // --- Users ---
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, status)
    VALUES (@name, @email, @password, @role, @status)
  `);

  const users = [
    { name: 'Alice Admin',   email: 'admin@finance.com',   password: bcrypt.hashSync('Admin123!',    SALT_ROUNDS), role: 'admin',   status: 'active' },
    { name: 'Ana Analyst',   email: 'analyst@finance.com', password: bcrypt.hashSync('Analyst123!',  SALT_ROUNDS), role: 'analyst', status: 'active' },
    { name: 'Victor Viewer', email: 'viewer@finance.com',  password: bcrypt.hashSync('Viewer123!',   SALT_ROUNDS), role: 'viewer',  status: 'active' },
  ];

  const insertMany = db.transaction((rows) => rows.forEach(u => insertUser.run(u)));
  insertMany(users);

  const adminId = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@finance.com').id;

  // --- Financial Records ---
  const insertRecord = db.prepare(`
    INSERT INTO financial_records (amount, type, category, date, notes, created_by)
    VALUES (@amount, @type, @category, @date, @notes, @created_by)
  `);

  const records = [
    { amount: 12000,  type: 'income',  category: 'salary',         date: '2026-01-05', notes: 'January salary',         created_by: adminId },
    { amount: 450,    type: 'expense', category: 'utilities',       date: '2026-01-10', notes: 'Electricity bill',        created_by: adminId },
    { amount: 800,    type: 'expense', category: 'rent',            date: '2026-01-15', notes: 'Office rent',             created_by: adminId },
    { amount: 3500,   type: 'income',  category: 'freelance',       date: '2026-01-20', notes: 'Freelance project A',     created_by: adminId },
    { amount: 250,    type: 'expense', category: 'subscriptions',   date: '2026-01-22', notes: 'SaaS tools',              created_by: adminId },
    { amount: 12000,  type: 'income',  category: 'salary',          date: '2026-02-05', notes: 'February salary',        created_by: adminId },
    { amount: 450,    type: 'expense', category: 'utilities',       date: '2026-02-10', notes: 'Electricity bill',        created_by: adminId },
    { amount: 800,    type: 'expense', category: 'rent',            date: '2026-02-15', notes: 'Office rent',             created_by: adminId },
    { amount: 2200,   type: 'income',  category: 'freelance',       date: '2026-02-18', notes: 'Freelance project B',     created_by: adminId },
    { amount: 600,    type: 'expense', category: 'equipment',       date: '2026-02-25', notes: 'Keyboard + monitor arm',  created_by: adminId },
    { amount: 12000,  type: 'income',  category: 'salary',          date: '2026-03-05', notes: 'March salary',           created_by: adminId },
    { amount: 450,    type: 'expense', category: 'utilities',       date: '2026-03-10', notes: 'Electricity bill',        created_by: adminId },
    { amount: 800,    type: 'expense', category: 'rent',            date: '2026-03-15', notes: 'Office rent',             created_by: adminId },
    { amount: 5000,   type: 'income',  category: 'consulting',      date: '2026-03-20', notes: 'Strategy consulting',     created_by: adminId },
    { amount: 1200,   type: 'expense', category: 'marketing',       date: '2026-03-28', notes: 'Ad spend Q1',             created_by: adminId },
  ];

  const insertRecords = db.transaction((rows) => rows.forEach(r => insertRecord.run(r)));
  insertRecords(records);

  console.log('Seed complete.\n');
  console.log('Demo accounts:');
  console.log('  admin@finance.com   / Admin123!   (admin)');
  console.log('  analyst@finance.com / Analyst123! (analyst)');
  console.log('  viewer@finance.com  / Viewer123!  (viewer)');
}

seed();
