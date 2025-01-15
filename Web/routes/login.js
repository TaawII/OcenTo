const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/auth-controller');

// Wyświetlenie formularza logowania
router.get('/', (req, res) => {
  res.render('auth/login', { error: null, success: null });
});

// Obsługa logowania (POST)
router.post('/', loginUser);

module.exports = router;
