const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const { loadEnv } = require('./env');

loadEnv();

let initPromise = null;

function pickEnv(keys, fallback) {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
}

const pool = mysql.createPool({
  host: pickEnv(['MYSQLHOST', 'MYSQL_HOST', 'DB_HOST'], '127.0.0.1'),
  port: Number(pickEnv(['MYSQLPORT', 'MYSQL_PORT', 'DB_PORT'], 3306)),
  user: pickEnv(['MYSQLUSER', 'MYSQL_USER', 'DB_USER'], 'root'),
  password: pickEnv(['MYSQLPASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD'], ''),
  database: pickEnv(['MYSQLDATABASE', 'MYSQL_DATABASE', 'DB_NAME'], 'railway'),
  waitForConnections: true,
  connectionLimit: Number(pickEnv(['DB_CONNECTION_LIMIT'], 10)),
  queueLimit: 0
});

async function addColumnIfNotExists(conn, table, column, definition) {
  const [rows] = await conn.query(
    `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?`,
    [table, column]
  );

  if (rows.length === 0) {
    await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}

async function seedAdmin(conn) {
  const username = pickEnv(['ADMIN_USERNAME'], '');
  const password = pickEnv(['ADMIN_PASSWORD'], '');

  if (!username || !password) return;

  const [rows] = await conn.query('SELECT id FROM admins WHERE username = ? LIMIT 1', [username]);
  if (rows.length > 0) return;

  const hash = await bcrypt.hash(password, 12);
  await conn.query(
    'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
    [username, hash, 'admin']
  );
}

async function initializeDatabase() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const conn = await pool.getConnection();
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'admin',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS articles (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content LONGTEXT,
          category VARCHAR(255),
          description TEXT,
          meta1 VARCHAR(255),
          meta2 VARCHAR(255),
          author_name VARCHAR(255),
          author_email VARCHAR(255),
          author_social VARCHAR(255),
          image_url VARCHAR(255),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          is_recommended TINYINT(1) NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price VARCHAR(255),
          category VARCHAR(255),
          meta1 VARCHAR(255),
          meta2 VARCHAR(255),
          image_url VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS events (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          category VARCHAR(255),
          city VARCHAR(255),
          event_time DATETIME,
          price VARCHAR(255),
          description TEXT,
          organizer VARCHAR(255),
          reg_info VARCHAR(255),
          email VARCHAR(255),
          image_url VARCHAR(255),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS red_letters (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          message LONGTEXT,
          track VARCHAR(255),
          date VARCHAR(255),
          category VARCHAR(255),
          description TEXT,
          meta1 VARCHAR(255),
          meta2 VARCHAR(255),
          image_url VARCHAR(255),
          status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      await addColumnIfNotExists(conn, 'articles', 'image_url', 'VARCHAR(255)');
      await addColumnIfNotExists(conn, 'articles', 'status', "ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
      await addColumnIfNotExists(conn, 'articles', 'is_recommended', 'TINYINT(1) NOT NULL DEFAULT 0');

      await addColumnIfNotExists(conn, 'products', 'image_url', 'VARCHAR(255)');
      await addColumnIfNotExists(conn, 'events', 'status', "ENUM('pending', 'approved', 'rejected') DEFAULT 'pending'");
      await addColumnIfNotExists(conn, 'events', 'image_url', 'VARCHAR(255)');

      await addColumnIfNotExists(conn, 'red_letters', 'title', 'VARCHAR(255) NOT NULL DEFAULT "Anonymous"');
      await addColumnIfNotExists(conn, 'red_letters', 'message', 'LONGTEXT');
      await addColumnIfNotExists(conn, 'red_letters', 'track', 'VARCHAR(255)');
      await addColumnIfNotExists(conn, 'red_letters', 'date', 'VARCHAR(255)');
      await addColumnIfNotExists(conn, 'red_letters', 'status', "ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'");
      await addColumnIfNotExists(conn, 'red_letters', 'image_url', 'VARCHAR(255)');

      await seedAdmin(conn);
    } finally {
      conn.release();
    }
  })();

  return initPromise;
}

module.exports = {
  pool,
  query: pool.query.bind(pool),
  getConnection: pool.getConnection.bind(pool),
  initializeDatabase
};
