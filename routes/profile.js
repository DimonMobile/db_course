var express = require('express');
var router = express.Router();

router.get('/main', function(req, res, next) {
  res.render('profile/main');
});

router.get('/posts', function(req, res, next) {
  res.render('profile/posts');
});

router.get('/administration', function(req, res, next) {
  res.render('profile/administration');
});
module.exports = router;
