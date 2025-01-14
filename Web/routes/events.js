const express = require('express');
const router = express.Router();
const eventController = require('../controllers/events-controller');
const multer = require('multer');

const upload = multer({dest: 'routes/'});
router.get('/create', eventController.renderCreateEvent);
router.post('/create',upload.single('image'), eventController.submitEvent);

module.exports = router;
