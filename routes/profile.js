var express = require('express');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.get('/information', async function (req, res, next) {

  if (req.query.userId === undefined) {
    if (req.session.userId === undefined) {
      next(new Error('Page does not exist'));
      return;
    } else {
      res.redirect(`/profile/information?userId=${req.session.userId}`);
    }
  }

  let connection = await oracledb.getConnection(dbconf);
  let procedureResult = await connection.execute(`BEGIN :ret := GET_USER_DATA_BY_ID(:id); END;`, {
    id: req.query.userId,
    ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
  });

  let resultSet = procedureResult.outBinds.ret;

  let row = await resultSet.getRow();

  if (row === undefined) {
    throw new Error('User not found');
  }

  let userData = {
    id: row[0],
    email: row[1],
    nickname: row[5],
    firstName: row[3],
    lastName: row[4],
    sendNews: row[6],
    birthdaty: row[7],
    created: row[8],
    role: row[9],
    iconpath: '/images/avatars/' + row[10]
  }

  res.render('profile/information', { session: req.session, req: req, userData: userData });
});

router.get('/posts', function (req, res, next) {
  if (req.query.userId == undefined) {
    res.redirect(`posts?userId=${req.session.userId}`);
    res.end();
    return;
  }
  oracledb.getConnection(dbconf).then(result => {
    result.execute(`BEGIN :ret := GET_USER_MATERIALS(:id); END;`, {
      id: req.query.userId, // TODO: add validator
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
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
        materials.push({ id: row[0], subject: row[2], created: row[4], status: status });
      }
      resultSet.close();
      res.render('profile/posts', { session: req.session, req: req, materials: materials });
    }).catch(error => {
      next(error);
    });
  }).catch(error => {
    console.log(`Procedure call error: ${error.message}`);
    next(error);
  });
});

router.get('/administration', function (req, res, next) {
  res.render('profile/administration', { session: req.session, req: req });
});
module.exports = router;
