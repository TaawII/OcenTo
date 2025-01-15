const express = require('express');
const router = express.Router();
const { logout } = require('../controllers/auth-controller');

router.get('/', logout);

module.exports = router;
