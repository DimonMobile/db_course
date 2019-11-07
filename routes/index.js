var express = require('express');
var multer = require('multer');
var upload = multer({dest: 'public/images/avatars/'}).single('avatar');
var crypto = require('crypto');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'PubMag', session: req.session });
});

router.get('/about', function(req, res, next) {
  res.render('about', { session: req.session });
});

router.get('/register', function(req, res, next) {
  res.render('register', { session: req.session });
});

router.post('/', function(req, res, next) {
  oracledb.getConnection(dbconf).then(result => {

    result.execute(`BEGIN :ret := GET_USER_DATA(:email); END;`, {
      email: req.body.email,
      ret: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR}
    }).then(result => {
      let resultSet = result.outBinds.ret;
      resultSet.getRow().then(row => {
        resultSet.close();

        let hash = crypto.createHash('sha256').update(req.body.password).digest('hex');
        
        if (row != undefined && hash == row[2]) {
          req.session.userId = row[0];
          req.session.userEmail = row[1];
          req.session.userFirstName = row[3];
          req.session.userLastName = row[4];
          req.session.userNickname = row[5];
          req.session.userRole = row[9];
          req.session.userIconPath = `/images/avatars/${row[10]}`;
          res.render('index', {loginSuccess: true, session: req.session});
        } else {
          res.render('index', {invalidLogin: true, session: req.session});
        }
      });
    }).catch(error => {
      next(error);
    });
  }).catch(error => {
    console.log(`Procedure call error: ${error.message}`);
    next(error);
  });
});

router.post('/register', upload, function (req, res, next) {
  oracledb.getConnection(dbconf).then(result => {
    // TODO: Add validators
    let hash = crypto.createHash('sha256').update(req.body.password).digest('hex');
    console.log(`Uplaoaded ${req.file.filename} || ${req.file.path}`);
    const procstr = `BEGIN REGISTER_USER('${req.body.email}', '${hash}', '${req.body.first_name}', '${req.body.last_name}', '${req.body.nickname}', TO_DATE('${req.body.birthday}', 'YYYY-MM-DD'), '${req.file.filename}', ${(req.body.sendnews == 'on') ? 1 : 0}); END;`;
    result.execute(procstr).then(result => {
      res.render('register', { registered: true, session: req.session });
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
