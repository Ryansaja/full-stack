const pool = require('./db');

async function alterDb() {
  try {
    // Modify articles
    await pool.query('ALTER TABLE articles ADD COLUMN category VARCHAR(255), ADD COLUMN description TEXT, ADD COLUMN meta1 VARCHAR(255), ADD COLUMN meta2 VARCHAR(255)');
    console.log('Altered articles table.');

    // Modify red_letters
    await pool.query('ALTER TABLE red_letters ADD COLUMN category VARCHAR(255), ADD COLUMN description TEXT, ADD COLUMN meta1 VARCHAR(255), ADD COLUMN meta2 VARCHAR(255)');
     console.log('Altered red_letters table.');

    // Modify products
    // products already has description and price. We'll map category, meta1, meta2 appropriately.
    // Actually, to make it exactly like frontend, let's just add category, meta1, meta2.
    await pool.query('ALTER TABLE products ADD COLUMN category VARCHAR(255), ADD COLUMN meta1 VARCHAR(255), ADD COLUMN meta2 VARCHAR(255)');
     console.log('Altered products table.');

    console.log('Database schema successfully updated to match frontend.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist. Schema is fine.');
      process.exit(0);
    } else {
      console.error('Error altering table:', error);
      process.exit(1);
    }
  }
}

alterDb();
