const express = require('express');

const redLetterController = require('../controllers/redLetterController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { asyncHandler } = require('../utils/request');

const router = express.Router();

router.get('/', asyncHandler(redLetterController.getAllRedLetters));
router.get('/:id', asyncHandler(redLetterController.getRedLetterById));
router.post('/', upload.single('image'), asyncHandler(redLetterController.createRedLetter));
router.put('/:id', authenticateToken, upload.single('image'), asyncHandler(redLetterController.updateRedLetter));
router.delete('/:id', authenticateToken, asyncHandler(redLetterController.deleteRedLetter));

module.exports = router;
