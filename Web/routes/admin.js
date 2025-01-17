const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { isAdmin } = require('../utils/auth');

// Trasa do pobierania wszystkich wydarzeń (tylko dla adminów)
router.get('/allevents', isAdmin, adminController.getAllEvents);
router.get('/allevents/:id', adminController.getEvent);
router.get('/allevents/:id/items', adminController.getEventItems);
router.get('/allevents/:eventId/items/:itemId/ratings', adminController.getItemRatings);

module.exports = router;
