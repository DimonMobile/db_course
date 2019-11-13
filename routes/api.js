var express = require('express');
var router = express.Router();

const dbconf = require('../conf/dbconf').dbconf;
const oracledb = require('oracledb');

router.get('/getComments', function (req, res, next) {

});

router.post('/postComment', async function (req, res, next) {
    try {
        if (req.session.userId === undefined) {
            throw new Error('Insufficient permissions. User is not authorized.');
        }

        res.end(req.body.id);
        return;

        let connection = await oracledb.getConnection(dbconf);
        let procedureResult = await connection.execute(`BEGIN :ret := GET_MATERIAL_INFORMATION(:id); END;`, {
            id: req.query.id,
            ret: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
        });

        let resultSet = procedureResult.outBinds.ret;
        let row = await resultSet.getRow();
        if (row == undefined)
            throw new Error('Material not found');
        resultSet.close();
    } catch (e) {
        res.end(JSON.stringify({ error: e.message }));
    }
});
module.exports = router;