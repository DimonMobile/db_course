var express = require('express');
var multer = require('multer');
var uploadAvatar = multer({ dest: 'public/images/avatars/' }).single('avatar');
var uploadPicture = multer({ dest: 'public/images/uploads/' }).single('image');
var getFields = multer();
var crypto = require('crypto');
var router = express.Router();
var elasticsearch = require('elasticsearch');
var fs = require('fs');
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
var confirmPageAddress = 'http://192.168.56.101:3000/confirm'

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');
const mailCreds = require('C:/Users/Admin/Documents/creds.js');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: mailCreds.service,
  auth: {
    user: mailCreds.email,
    pass: mailCreds.password
  }
});

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

router.get('/getXml', async function (req, res, next) {
  if (req.session.userId === undefined || req.session.userRole < 4) {
    next(new Error('Access denied!'));
    return;
  }

  let connection = await oracledb.getConnection(dbconf);
  let procedureResult = await connection.execute(`BEGIN :ret := EXPORT_USERS; END;`, {
    ret: { dir: oracledb.BIND_OUT, type: oracledb.CLOB }
  });

  let resultSet = procedureResult.outBinds.ret;

  let dataReader = function streamReader() {
    return new Promise((resolve, reject) => {
      let collectedData = '';

      resultSet.on('data', chunk => {
        collectedData += chunk;
      });

      resultSet.on('error', error => reject(error));

      resultSet.on('end', () => {
        resolve(collectedData);
      });
    });
  }

  fs.writeFile('exported.xml', await dataReader(), err => {
    if (err) {
      res.end(JSON.stringify({error: err.message}), 'application/json');
    } else {
      res.end(JSON.stringify({status: 'ok'}), 'application/json');
    }
  });
});

router.get('/search', function (req, res, next) {
  if (req.query.q === undefined) {
    res.render('search', { session: req.session, req: req });
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
      res.render('search', { session: req.session, hits: hits, req: req });
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
  if (req.session.userRole < 2) {
    res.end(JSON.stringify({ error: 'Access denied!' }));
  }
  oracledb.getConnection(dbconf).then(result => {
    result.execute(`BEGIN :ret := ADD_MATERIAL(${req.session.userId}, '${req.body.subject}', '${req.body.content.replace("'", "''")}'); END;`, {
      ret: {dir: oracledb.BIND_OUT, type: oracledb.NUMBER}
    }).then(async result => {
      res.end(JSON.stringify({ status: 'ok' }));
      await client.index({
        index: 'pub-house',
        body: {
          id: result.outBinds.ret,
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
          if (row[9] === 0) {
            res.render('index', { invalidLogin: true, session: req.session, loginMessage: 'Please confirm your email address, before you can access the account!' });
          } else {
            req.session.userId = row[0];
            req.session.userEmail = row[1];
            req.session.userFirstName = row[3];
            req.session.userLastName = row[4];
            req.session.userNickname = row[5];
            req.session.userRole = row[9];
            req.session.userIconPath = `/images/avatars/${row[10]}`;
            res.render('index', { loginSuccess: true, session: req.session });
          }
        } else {
          res.render('index', { invalidLogin: true, session: req.session, loginMessage: 'Login/password pair is incorrect' });
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

router.get('/confirm', async function (req, res, next) {
  try {
    let connection = await oracledb.getConnection(dbconf);
    let procedureResult = await connection.execute(`BEGIN  CONFIRM_TOKEN('${req.query.token}'); END;`);
    res.render('index', { invalidLogin: true, session: req.session, loginMessage: 'Your account was confirmed!' });
  } catch (e) {
    next(e);
  }
});

router.post('/register', uploadAvatar, function (req, res, next) {
  oracledb.getConnection(dbconf).then(connection => {
    // TODO: Add validators
    let hash = crypto.createHash('sha256').update(req.body.password).digest('hex');
    let token = crypto.createHash('sha256').update(req.body.email + 'saltsaltsalt').digest('hex');
    console.log(`Uplaoaded ${req.file.filename} || ${req.file.path}`);
    const procstr = `BEGIN REGISTER_USER('${req.body.email}', '${hash}', '${req.body.first_name}', '${req.body.last_name}', '${req.body.nickname}', TO_DATE('${req.body.birthday}', 'YYYY-MM-DD'), '${req.file.filename}', ${(req.body.sendnews == 'on') ? 1 : 0}); END;`;
    connection.execute(procstr).then(async result => {
      await connection.execute(`BEGIN ADD_TOKEN('${req.body.email}', '${token}'); END;`);
      var mailOptions = {
        from: mailCreds.email,
        to: req.body.email,
        subject: 'PubHouse confirmation',
        text: `Confirm email by the link below ${confirmPageAddress}?token=${token}`
      };

      console.log('Sending mail...');
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
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
