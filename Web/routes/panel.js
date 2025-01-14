const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events-controller');

// Trasa do wyświetlania szczegółów wydarzenia
router.get('/events/:id', eventsController.getEvent);

// Wyświetlenie formularza edycji
router.get('/events/:id/edit', eventsController.renderEditForm);

// Trasa do edytowania wydarzenia
router.post('/events/:id/edit', eventsController.editEvent);


module.exports = router;