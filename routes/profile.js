var express = require('express');
var router = express.Router();

router.get('/information', function(req, res, next) {
  res.render('profile/information', {session: req.session});
});

router.get('/posts', function(req, res, next) {
  res.render('profile/posts', {session: req.session});
});

router.get('/administration', function(req, res, next) {
  res.render('profile/administration', {session: req.session});
});
module.exports = router;
