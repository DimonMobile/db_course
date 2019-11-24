var express = require('express');
var multer = require('multer');
var uploadAvatar = multer({ dest: 'public/images/avatars/' }).single('avatar');
var uploadPicture = multer({ dest: 'public/images/uploads/' }).single('image');
var getFields = multer();
var crypto = require('crypto');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.get('/', function (req, res, next) {
  res.render('index', { title: 'PubMag', session: req.session });
});

router.get('/create', function (req, res, next) {
  res.render('create', { session: req.session });
});

router.get('/about', function (req, res, next) {
  res.render('about', { session: req.session });
});

router.get('/register', function (req, res, next) {
  res.render('register', { session: req.session });
});

router.get('/material', function (req, res, next) {
  if (req.query.id == undefined) {
    res.redirect('/');
    res.end();
    return;
  }

  if (req.query.action !== undefined) {
    if (req.query.action !== undefined) {
      if (req.session.userRole === undefined || req.session.userRole < 3) {
        throw new Error('Access granted! If you think that it is wrong, please contact the administrator.');
      }

      oracledb.getConnection(dbconf).then(async connection => {
        if (req.query.action === 'accept') {
          await connection.execute(`BEGIN SET_MATERIAL_STATUS(${req.query.id}, 'DEFAULT'); END;`);
        } else if (req.query.action == 'reject') {
          await connection.execute(`BEGIN SET_MATERIAL_STATUS(${req.query.id}, 'REJECTED'); END;`);
        }
        res.redirect(`/material?id=${req.query.id}`);
        return;
      }).catch(e => next(e));
    }
    return;
  }

  oracledb.getConnection(dbconf).then(async result => {
    let procedureResult = await result.execute(`BEGIN :ret := GET_MATERIAL_INFORMATION(:id); END;`, {
      id: req.query.id,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
    });
    let resultSet = procedureResult.outBinds.ret;
    let row = await resultSet.getRow();
    if (row == undefined)
      throw new Error('Material not found');
    resultSet.close();

    let stream = row[5];

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

    let materialData = { id: row[0], authorId: row[1], authorNickname: row[2], created: row[3], subject: row[4], content: await dataReader(), status: row[6] };
    res.render('material', { session: req.session, material: materialData });
  }).catch(e => next(e));
});

router.get('/search', function(req, res, next) {
  if (req.query.q === undefined) {
    res.render('search', {session: req.session, req: req});
  } else {
    client.search({
      index: 'pub-house',
      body: {
        query: {
          match: {
            content: req.query.q
          }
        }
      }
    }).then(function (resp) {
        var hits = resp.hits.hits;
        res.render('search', {session: req.session, hits: hits, req: req});
        console.log(hits);
    }).catch(function (err) {
        console.trace(err.message);
        next(err);
    });
  }
});

router.post('/createPost', getFields.any(), function (req, res, next) {
  // TODO: check authorization
  // TODO: write validators
  if (req.session.userRole < 2)
  {
    res.end(JSON.stringify({error: 'Access denied!'}));
  }
  oracledb.getConnection(dbconf).then(result => {
    result.execute(`BEGIN ADD_MATERIAL(${req.session.userId}, '${req.body.subject}', '${req.body.content}'); END;`).then(async result => {
      res.end(JSON.stringify({ status: 'ok' }));
      await client.index({
        index: 'pub-house',
        body: {
          subject: req.body.subject,
          content: req.body.content
        }
      });
    }).catch(err => {
      res.end(JSON.stringify({ status: err.message }));
      console.log(err.message);
    });
  });
});

router.post('/', function (req, res, next) {
  oracledb.getConnection(dbconf).then(result => {

    result.execute(`BEGIN :ret := GET_USER_DATA(:email); END;`, {
      email: req.body.email,
      ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
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
          res.render('index', { loginSuccess: true, session: req.session });
        } else {
          res.render('index', { invalidLogin: true, session: req.session });
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

router.post('/register', uploadAvatar, function (req, res, next) {
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

router.post('/upload', uploadPicture, function (req, res, next) {
  res.end(JSON.stringify({ path: `/images/uploads/${req.file.filename}`, originalName: req.file.originalname }));
});

module.exports = router;
