const express = require('express');
const router = express.Router();
const spotifyController = require('../controllers/spotifyController');

// Menerima parameter GET ?q=judul_lagu
router.get('/search', spotifyController.searchTracks);

module.exports = router;
