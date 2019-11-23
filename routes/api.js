var express = require('express');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.post('/getNotifications', async function (req, res, next) {
  try {
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }
    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_USER_NOTIFICATIONS(:user_id); END;`, {
      user_id: req.session.userId,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });
    let resultSet = procedureResult.outBinds.ret;

    let row;
    let resultArray = [];
    while ((row = await resultSet.getRow())) {
      resultArray.push({
        created: row[2],
        content: row[3]
      });
    }
    resultSet.close();
    res.end(JSON.stringify({items: resultArray}));
  } catch (e) {
    res.end(JSON.stringify({error: e.message}));
  }
});

router.post('/getFeed', async function (req, res, next) {
  try {
    let offset = 1;
    let count = 10;
    if (req.body.offset !== undefined)
      offset = parseInt(req.body.offset);
    if (req.body.count !== undefined)
      count = Math.min(parseInt(req.body.count), 10);

    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_MATERIALS_FULL(:offset, :count); END;`, {
      offset: offset,
      count: count,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });
    let resultSet = procedureResult.outBinds.ret;

    let row;

    let resultArray = [];
    while ((row = await resultSet.getRow())) {

      let stream = row[4];
      let dataReader = function streamReader() {
        return new Promise((resolve, reject) => {
          let collectedData = '';
  
          stream.on('data', chunk => {
            collectedData += chunk;
          });
  
          stream.on('error', error => reject(error));
  
          stream.on('end', () => {
            resolve(collectedData);
          });
        });
      }

      resultArray.push({
        id: row[1],
        created: row[2],
        subject: row[3],
        content: await dataReader()
      });
    }
    await resultSet.close();
    res.end(JSON.stringify({items: resultArray}));
  } catch (e) {
    res.end(JSON.stringify({error: e.message}));
  }
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
    let offset = 1;
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

    await resultSet.close();
    res.end(JSON.stringify(commentsObject));
    // GET_COMMENTS(nMaterialId number, nOffset number, nCount number)


  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  }
});

router.post('/getMaterials', async function (req, res, next) {
  try {
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }

    if (req.body.status === undefined) {
      throw new Error('Bad request.');
    }

    if (req.session.userRole === undefined || req.session.userRole < 3) {
      throw new Error('Access granted! If you think that it is wrong, please contact the administrator.');
    }

    let offset = 1;
    let count = 10;
    if (req.body.offset !== undefined)
      offset = parseInt(req.body.offset);
    if (req.body.count !== undefined)
      count = Math.min(parseInt(req.body.count), 10);

    console.log(`Get comments as count = ${count}, offset = ${offset}`);
    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_MATERIALS(:status, :offset, :count); END;`, {
      status: req.body.status,
      offset: offset,
      count: count,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });

    let resultSet = procedureResult.outBinds.ret;
    let row;
    let resultArray = [];
    while (row = await resultSet.getRow()) {
      // id created subject status
      resultArray.push({
        id: row[1],
        created: row[2],
        subject: row[3],
        status: row[4]
      });
    }
    await resultSet.close();

    let resultObject = {
      items: resultArray
    }

    res.end(JSON.stringify(resultObject));
  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  };
});

router.post('/getUsers', async function (req, res, next) {
  try {
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }

    if (req.session.userRole === undefined || req.session.userRole < 4) {
      throw new Error('Access granted! If you think that it is wrong, please contact the administrator.');
    }

    let offset = 1;
    let count = 10;
    if (req.body.offset !== undefined)
      offset = parseInt(req.body.offset);
    if (req.body.count !== undefined)
      count = Math.min(parseInt(req.body.count), 10);

    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN :ret := GET_USERS(:offset, :count); END;`, {
      offset: offset,
      count: count,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });

    let resultSet = procedureResult.outBinds.ret;
    let row;
    let resultArray = [];
    while (row = await resultSet.getRow()) {
      // id created subject status
      resultArray.push({
        id: row[1],
        nickname: row[2],
        email: row[3],
        role: row[4],
        created: row[5]
      });
    }
    await resultSet.close();

    let resultObject = {
      items: resultArray
    }

    res.end(JSON.stringify(resultObject));
  } catch (e) {
    res.end(JSON.stringify({ error: e.message }));
  };
});

router.post('/setUserRole', async function (req, res, next) {
  try {
    if (req.session.userId === undefined) {
      throw new Error('Insufficient permissions. User is not authorized.');
    }

    if (req.session.userRole !== 4) {
      throw new Error('Insufficient permissions.');
    }

    if (req.body.id === undefined || req.body.role === undefined) {
      throw new Error('Bad request.');
    }

    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN SET_USER_ROLE(:id, :role); END;`, {
      id: req.body.id,
      role: req.body.role
    });

    res.end(JSON.stringify({status: 'ok'}));
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
    await resultSet.close();
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