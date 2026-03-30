const { loadEnv } = require('./src/config/env');
const { initializeDatabase } = require('./src/config/db');
const app = require('./src/app');

loadEnv();

const PORT = Number(process.env.PORT || 5000);

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`API server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error);
    process.exit(1);
  }
}

start();
