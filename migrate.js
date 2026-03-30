const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

function pickEnv(keys, fallback) {
  for (const key of keys) {
    const val = process.env[key];
    if (val !== undefined && val !== null && `${val}`.trim() !== '') return val;
  }
  return fallback;
}

async function migrate() {
  const pool = mysql.createPool({
    host: pickEnv(['MYSQLHOST', 'MYSQL_HOST', 'DB_HOST'], 'localhost'),
    port: Number(pickEnv(['MYSQLPORT', 'MYSQL_PORT', 'DB_PORT'], 3306)),
    user: pickEnv(['MYSQLUSER', 'MYSQL_USER', 'DB_USER'], 'root'),
    password: pickEnv(['MYSQLPASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD'], ''),
    database: pickEnv(['MYSQLDATABASE', 'MYSQL_DATABASE', 'DB_NAME'], 'red_letter_db'),
  });

  try {
    console.log('Adding is_recommended column to articles table...');
    await pool.query('ALTER TABLE articles ADD COLUMN is_recommended TINYINT(1) DEFAULT 0');
    console.log('Migration successful!');
  } catch (error) {
    if (error.code === 'ER_DUP_COLUMN_NAME') {
      console.log('Column is_recommended already exists.');
    } else {
      console.error('Migration failed:', error);
    }
  } finally {
    await pool.end();
  }
}

migrate();
