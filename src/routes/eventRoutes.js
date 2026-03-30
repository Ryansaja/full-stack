const express = require('express');

const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { asyncHandler } = require('../utils/request');

const router = express.Router();

router.get('/admin/all', authenticateToken, asyncHandler(eventController.getAllEventsAdmin));
router.post('/admin', authenticateToken, upload.single('image'), asyncHandler(eventController.createEventAdmin));
router.patch('/admin/:id/approve', authenticateToken, asyncHandler(eventController.approveEvent));
router.patch('/admin/:id/reject', authenticateToken, asyncHandler(eventController.rejectEvent));

router.get('/', asyncHandler(eventController.getAllEvents));
router.get('/:id', asyncHandler(eventController.getEventById));
router.post('/', upload.single('image'), asyncHandler(eventController.createEvent));
router.put('/:id', authenticateToken, upload.single('image'), asyncHandler(eventController.updateEvent));
router.delete('/:id', authenticateToken, asyncHandler(eventController.deleteEvent));

module.exports = router;
