const app  = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`\nFinance Backend API running on http://localhost:${PORT}`);
  console.log(`API Docs:          http://localhost:${PORT}/api/docs`);
  console.log(`\nRun 'npm run seed' to load demo data if you haven't already.\n`);
});
