var express = require('express');
var router = express.Router();

router.get('/information', function(req, res, next) {
  res.render('profile/information');
});

router.get('/posts', function(req, res, next) {
  res.render('profile/posts');
});

router.get('/administration', function(req, res, next) {
  res.render('profile/administration');
});
module.exports = router;
