var express = require('express');
var multer = require('multer');
var upload = multer({dest: 'public/images/avatars/'}).single('avatar');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PubMag' });
});

router.get('/about', function(req, res, next) {
  res.render('about');
});

router.get('/register', function(req, res, next) {
  res.render('register');
});

router.post('/register', upload, function(req, res, next) {
  oracledb.getConnection(dbconf).then(result => {
    // TODO: Add validators
    const procstr = `BEGIN REGISTER_USER('${req.body.email}', '${req.body.password}', '${req.body.first_name}', '${req.body.last_name}', '${req.body.nickname}', TO_DATE('${req.body.birthday}', 'YYYY-MM-DD'), '${req.file.path}', ${(req.body.sendnews == 'on') ? 1 : 0}); END;`;
    result.execute(procstr).then(result => {
      res.render('register', {registered: true});
    }).catch(error => {
      console.log(`Procedure call error: ${error.message}`);
      next(error);
    });
  }).catch(error => {
    console.log(`Database connection error: ${error.message}`);
    next(error);
  });

  
});

module.exports = router;
