const express = require('express');

const articleController = require('../controllers/articleController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { asyncHandler } = require('../utils/request');

const router = express.Router();

router.get('/admin/all', authenticateToken, asyncHandler(articleController.getAllArticlesAdmin));
router.post('/admin', authenticateToken, upload.single('image'), asyncHandler(articleController.createArticleAdmin));
router.patch('/admin/:id/approve', authenticateToken, asyncHandler(articleController.approveArticle));
router.patch('/admin/:id/reject', authenticateToken, asyncHandler(articleController.rejectArticle));
router.patch('/admin/:id/recommend', authenticateToken, asyncHandler(articleController.toggleRecommendArticle));

router.get('/', asyncHandler(articleController.getAllArticles));
router.get('/:id', asyncHandler(articleController.getArticleById));
router.post('/', upload.single('image'), asyncHandler(articleController.createArticle));
router.put('/:id', authenticateToken, upload.single('image'), asyncHandler(articleController.updateArticle));
router.delete('/:id', authenticateToken, asyncHandler(articleController.deleteArticle));

module.exports = router;
