const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { query } = require('../config/db');

exports.login = async (req, res) => {
  try {
    const username = String(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const [rows] = await query(
      'SELECT id, username, password, role FROM admins WHERE username = ? LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const admin = rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT secret is not configured.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role || 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      message: 'Login successful.',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        role: admin.role || 'admin'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updateCredentials = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await query(
      'UPDATE admins SET username = ?, password = ? WHERE id = ?',
      [username, hashedPassword, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    return res.json({ message: 'Credentials updated successfully.' });
  } catch (error) {
    console.error('Update credentials error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username is already taken.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const adminRole = role || 'admin';
    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      'INSERT INTO admins (username, password, role) VALUES (?, ?, ?)',
      [username, hashedPassword, adminRole]
    );

    return res.status(201).json({ message: 'New sub-admin created successfully.' });
  } catch (error) {
    console.error('Create admin error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username is already taken.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

