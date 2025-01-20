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

// Usuwanie wydarzenia
router.delete('/events/:eventId/delete', eventsController.deleteEvent);

// Zmiana statusu wydarzenia
router.post('/events/:eventId/change-status', eventsController.changeEventStatus);

// Trasa GET dla itemów wydarzenia
router.get('/events/:event_id/items', itemsController.getEventItems);

// Wyświetlenie formularza do dodawania itemu
router.get('/events/:eventId/items/create', itemsController.getCreateItemForm);

// Dodanie nowego itemu
router.post('/events/:eventId/items/create', itemsController.createItem);

// Wyświetlenie formularza edycji dla danego itemu
router.get('/events/:eventId/items/:itemId/edit', itemsController.getEditItemForm);

// Zapisanie zmian w danym itemie
router.post('/events/:eventId/items/:itemId/edit', itemsController.editItem);

// Usuwanie itemu z wydarzenia
router.delete('/events/:eventId/items/:itemId/delete', itemsController.deleteItem);

// Wyświetlenie ocen i komentarzy dla danego itemu
router.get('/events/:eventId/items/:itemId/reviews', itemsController.getItemReviews);

// Usunięcie samego komentarza dla danej oceny
router.delete('/events/:eventId/items/:itemId/reviews/:ratingId/delete-comment', itemsController.deleteComment);

// Usunięcie całej oceny (punkty i komentarz)
router.delete('/events/:eventId/items/:itemId/reviews/:ratingId/delete', itemsController.deleteRating);

module.exports = router;

