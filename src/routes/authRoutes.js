const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.post('/login', authController.login);
router.put('/update', authenticateToken, authController.updateCredentials);
router.post('/register', authenticateToken, authController.createAdmin);

module.exports = router;

