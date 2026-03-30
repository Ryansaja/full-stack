const pool = require('./db');

async function migrateDb() {
  const conn = await pool.getConnection();
  try {
    console.log('Running migration: content moderation system...');

    // Helper: add column if not exists
    async function addColumnIfNotExists(table, column, definition) {
      const [rows] = await conn.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [table, column]
      );
      if (rows.length === 0) {
        await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        console.log(`  + Added column '${column}' to '${table}'`);
      } else {
        console.log(`  = Column '${column}' in '${table}' already exists, skipping.`);
      }
    }

    // ── articles ──────────────────────────────────────────────────────────────
    await addColumnIfNotExists('articles', 'category', 'VARCHAR(255)');
    await addColumnIfNotExists('articles', 'description', 'TEXT');
    await addColumnIfNotExists('articles', 'meta1', 'VARCHAR(255)');
    await addColumnIfNotExists('articles', 'meta2', 'VARCHAR(255)');
    await addColumnIfNotExists('articles', 'author_name', 'VARCHAR(255)');
    await addColumnIfNotExists('articles', 'author_email', 'VARCHAR(255)');
    await addColumnIfNotExists('articles', 'author_social', 'VARCHAR(255)');
    await addColumnIfNotExists(
      'articles', 'status',
      "ENUM('pending','approved','rejected') DEFAULT 'pending'"
    );

    // ── red_letters ───────────────────────────────────────────────────────────
    await addColumnIfNotExists('red_letters', 'category', 'VARCHAR(255)');
    await addColumnIfNotExists('red_letters', 'description', 'TEXT');
    await addColumnIfNotExists('red_letters', 'meta1', 'VARCHAR(255)');
    await addColumnIfNotExists('red_letters', 'meta2', 'VARCHAR(255)');

    // ── products ──────────────────────────────────────────────────────────────
    await addColumnIfNotExists('products', 'category', 'VARCHAR(255)');
    await addColumnIfNotExists('products', 'meta1', 'VARCHAR(255)');
    await addColumnIfNotExists('products', 'meta2', 'VARCHAR(255)');

    // ── events table (create if not exists) ───────────────────────────────────
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
    console.log("  = Table 'events' ensured.");

    console.log('\nMigration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    conn.release();
  }
}

migrateDb();
