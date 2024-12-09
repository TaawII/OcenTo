const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/auth-controller');

// Endpoint do wyświetlania formularza rejestracji
router.get('/', (req, res) => {
  res.render('auth/register', { error: null, success: null });
});

// Endpoint do obsługi rejestracji
router.post('/', registerUser);

module.exports = router;
