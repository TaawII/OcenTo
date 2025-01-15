const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events-controller');
const multer = require('multer');

const upload = multer({dest: 'routes/'});
router.get('/create', eventController.renderCreateEvent);
router.post('/create', eventController.submitEvent);
router.post('/decrypt-password', eventController.getDecryptedPassword);

module.exports = router;
