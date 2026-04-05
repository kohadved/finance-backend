require('dotenv').config();
const app  = require('./app');
const { seedIfEmpty } = require('./config/seed');

// Auto-seed demo data on first boot (no-op if data already exists)
seedIfEmpty();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nFinance Backend API  →  http://localhost:${PORT}`);
  console.log(`Swagger Docs         →  http://localhost:${PORT}/api/docs\n`);
});
