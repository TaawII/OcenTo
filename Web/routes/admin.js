const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin-controller');
const { isAdmin } = require('../utils/auth');

router.get('/allevents', adminController.getAllEvents);
router.delete('/allevents/:id', adminController.deleteEvent);
router.get('/allevents/:id', adminController.getEvent);
router.get('/allevents/:id/items', adminController.getEventItems);
router.delete('/allevents/:eventId/items/:itemId', adminController.deleteItem);
router.get('/allevents/:eventId/items/:itemId/ratings', adminController.getItemRatings);
router.delete('/allevents/:eventId/items/:itemId/ratings/:ratingId',adminController.deleteRatingAndComment);
router.delete('/allevents/:eventId/items/:itemId/ratings/:ratingId/delete-comment', adminController.deleteComment);

module.exports = router;
