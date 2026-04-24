const express = require('express');

const adController = require('../controllers/adController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { asyncHandler } = require('../utils/request');

const router = express.Router();

router.get('/active', asyncHandler(adController.getActiveAds));

router.get('/admin/all', authenticateToken, asyncHandler(adController.getAllAdsAdmin));
router.post('/admin', authenticateToken, upload.single('image'), asyncHandler(adController.createAd));
router.put('/:id', authenticateToken, upload.single('image'), asyncHandler(adController.updateAd));
router.patch('/admin/:id/toggle', authenticateToken, asyncHandler(adController.toggleAdStatus));
router.delete('/:id', authenticateToken, asyncHandler(adController.deleteAd));

module.exports = router;
