const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/events-controller');
const itemsController = require('../controllers/items-controller');

// Wszystkie eventy danego użytkownika
router.get('/events', eventsController.getUserEvents);

// Trasa do wyświetlania szczegółów wydarzenia
router.get('/events/:id', eventsController.getEvent);

// Wyświetlenie formularza edycji
router.get('/events/:id/edit', eventsController.renderEditForm);

// Trasa do edytowania wydarzenia
router.post('/events/:id/edit', eventsController.editEvent);

// Trasa GET dla itemów wydarzenia
router.get('/events/:event_id/items', itemsController.getEventItems);

// Wyświetlenie formularza do dodawania itemu
router.get('/events/:eventId/items/create', itemsController.getCreateItemForm);

// Dodanie nowego itemu
router.post('/events/:eventId/items/create', itemsController.createItem);




module.exports = router;

