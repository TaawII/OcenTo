const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/auth-controller');

router.get('/', (req, res) => {
  res.render('auth/login', { error: null, success: null });
});

router.post('/', loginUser);

module.exports = router;
