const express = require('express');
const router = express.Router();
const { registerUser } = require('../controllers/auth-controller');

router.get('/', (req, res) => {
  res.render('auth/register', { error: null, success: null });
});

router.post('/', registerUser);

module.exports = router;
