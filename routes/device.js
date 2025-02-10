const db = require('../db');
const log = require('../log');

const get = async function(req, res, next) {
    try {
	const { device_token } = req.params;

	console.log(device_token);
	const results = await db.query(
            `SELECT * FROM devices WHERE device_token = $1`,
	    [device_token]);

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		  'get device', null, {device_token: device_token, results: results.rows[0]});

	res.json({success: true, result: results.rows[0]});

    }
    catch (e) {
	console.log(e);
	res.json({success: false, error: e.message});
    }
    finally {
	return next;
    }
};

module.exports = {
    get: get
};
