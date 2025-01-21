var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.redirect('/login');
  res.render('index', { title: 'Express' });
});

module.exports = router;
