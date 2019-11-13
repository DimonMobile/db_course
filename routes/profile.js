var express = require('express');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.get('/information', function(req, res, next) {
  res.render('profile/information', {session: req.session, req: req});
});

router.get('/posts', function(req, res, next) {
  if (req.query.userId == undefined) {
    res.redirect(`posts?userId=${req.session.userId}`);
    res.end();
    return;
  }
  oracledb.getConnection(dbconf).then(result => {
    result.execute(`BEGIN :ret := GET_USER_MATERIALS(:id); END;`, {
      id: req.query.userId, // TODO: add validator
      ret: {dir: oracledb.BIND_OUT, type: oracledb.CURSOR}
    }).then(async result => {
      let resultSet = result.outBinds.ret;
      let row;
      let materials = [];
      while ((row = await resultSet.getRow())) {
        // 0 - id
        // 1 - owner id
        // 2 - subject
        // 4 - created
        // 5 - status
        let status;
        if (row[5] === 'PENDING') {
          status = 'On review';
        } else if (row[5] === 'DEFAULT') {
          status = 'Posted';
        } else if (row[5] == 'REJECTED') {
          status = 'Rejected';
        }
        materials.push({id: row[0], subject: row[2], created: row[4], status: status});
      }
      resultSet.close();
      res.render('profile/posts', {session: req.session, req: req, materials: materials});
    }).catch(error => {
      next(error);
    });
  }).catch(error => {
    console.log(`Procedure call error: ${error.message}`);
    next(error);
  });
});

router.get('/administration', function(req, res, next) {
  res.render('profile/administration', {session: req.session, req: req});
});
module.exports = router;
