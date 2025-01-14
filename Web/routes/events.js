const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events-controller');

router.get('/create', eventController.renderCreateEvent);
router.post('/create', eventController.createEvent);

module.exports = router;
