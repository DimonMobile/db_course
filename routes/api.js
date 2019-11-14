var express = require('express');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.get('/getComments', function (req, res, next) {

});

router.post('/getComments', async function (req, res, next) {
  // GET_COMMENTS(nMaterialId number, nOffset number, nCount number)
  try {
    // expected params
    // offset (= 0 by default)
    // count (= 10 by default)
    // material_id (= no default)
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }
    if (req.body.material_id === undefined) {
      throw new Error('Bad request.');
    }
    let offset = 0;
    let count = 10;
    if (req.body.offset !== undefined)
      offset = parseInt(req.body.offset);
    if (req.body.count !== undefined)
      count = Math.min(parseInt(req.body.count), 10);
    console.log(`Get comments as count = ${count}, offset = ${offset}`);
    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_COMMENTS(:id, :offset, :count); END;`, {
      id: req.body.material_id,
      offset: offset, 
      count: count,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });

    let resultSet = procedureResult.outBinds.ret;

    let commentsArray = [];
    let row;
    while ((row = await resultSet.getRow())) {
      let commentObject = {
        id: row[1],
        author_id: row[2],
        nickname: row[3],
        content: row[4],
        created: row[5],
        iconPath: row[6]
      }
      commentsArray.push(commentObject);
    }

    let commentsObject = {
      items: commentsArray,
    }
    // COMMENTS.ID, COMMENTS.AUTHOR_ID, USERS.NICKNAME, COMMENTS.CONTENT, COMMENTS.CREATED

    resultSet.close();
    res.end(JSON.stringify(commentsObject));
    // GET_COMMENTS(nMaterialId number, nOffset number, nCount number)


  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  }
});

router.post('/postComment', async function (req, res, next) {
  try {
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }

    if (req.body.id === undefined || req.body.content === undefined) {
      throw new Error('Bad request');
    }

    if (req.body.content.length < 10) {
      throw new Error('Minimum comment length is 10');
    }

    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_MATERIAL_INFORMATION(:id); END;`, {
      id: req.body.id,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });

    let resultSet = procedureResult.outBinds.ret;
    let row = await resultSet.getRow();
    resultSet.close();
    if (row == undefined)
      throw new Error('Material not found');

    if (row[6] !== 'DEFAULT') {
      throw new Error('Access restricted. Material does not support new comments.');
    }

    await connection.execute(`BEGIN ADD_COMMENT(${req.body.id}, ${req.session.userId}, '${req.body.content}'); END;`);

    res.end(JSON.stringify({ status: 'ok' }));
  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  }
});
module.exports = router;