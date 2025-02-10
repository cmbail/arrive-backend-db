const db = require('../db');
const log = require('../log');
const config = require('../config');
const helpers = require('../helpers');
const emailValidator = require('email-validator');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const twilio = require('twilio')(config.twilio.sid, config.twilio.token);

const create = async function(req, res, next) {
    let user_id;
    let primary = {};
    try {
	const { first_name, last_name, phone_numbers, email_addresses } = req.body;

	if (!first_name || first_name == '' ||
	    !last_name || last_name == '')
	    throw new Error('Need to specify first_name and last_name');

	if (!phone_numbers || !Array.isArray(phone_numbers) ||
	    !email_addresses || !Array.isArray(email_addresses))
	    throw new Error('phone_numbers and email_addresses must exist and be passed as arrays');

        await db.query('BEGIN');

	// insert user
	const userRes = await db.query(
	    `INSERT INTO users
               (user_type, first_name, last_name)
             VALUES
               ($1, $2, $3)
             RETURNING id`,
	    ['user', first_name, last_name]);

	if (userRes.rows.length != 1)
	    throw new Error('User not created');

	user_id = userRes.rows[0].id;

	// insert phone numbers
	for (let x=0; x<phone_numbers.length; x++) {
	    const phone_number = phoneUtil.parse(phone_numbers[x], 'US');
	    if (!phoneUtil.isValidNumberForRegion(phone_number, 'US'))
		throw new Error(phoneUtil.format(phone_number, PNF.E164)+' isn\'t a valid US phone number.');

	    const e164_phone_number = phoneUtil.format(phone_number, PNF.E164);
	    const code = helpers.random.integer(100000, 999999);
	    const phoneRes = await db.query(
		`INSERT INTO phone_numbers
                   (phone_number, user_id, attributes)
                 VALUES
                   ($1, $2, $3)
                 ON CONFLICT (phone_number) DO NOTHING
                 RETURNING user_id`,
		[e164_phone_number, user_id, {verified: false, code: code}]);
	    if (phoneRes.rows.length == 0)
		throw new Error(e164_phone_number+' is already associated with another user.');

	    // send confirmation SMS only to the first submitted phone_number
	    if (x == 0) {
		primary.number = e164_phone_number;
		primary.code = code;
	    }

	}

	// insert email addresses
	for (let x=0; x<email_addresses.length; x++) {
	    if (!emailValidator.validate(email_addresses[x]))
		throw new Error(email_addresses[x]+' doesn\'t look like a valid email address.');

	    const emailRes = await db.query(
		`INSERT INTO email_addresses
                   (email_address, user_id)
                 VALUES
                   ($1, $2)
                 ON CONFLICT (email_address) DO NOTHING
                 RETURNING user_id`,
		[email_addresses[x], user_id]);
	    if (emailRes.rows.length == 0)
		throw new Error(email_addresses[x]+' is already associated with another user.');

	}

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            'create user', user_id, req.body);

        await db.query('COMMIT');

	if (primary.number)
	    twilio.messages.create({
		body: 'Arrive confirmation code: '+primary.code,
		from: config.twilio.from,
		to: '+15163833848' // TODO: change to primary.number
	    });

	res.json({success: true, user_id: user_id});

    }
    catch (e) {
	console.log(e);
        await db.query('ROLLBACK');
	res.json({success: false, error: e.message});
    }
    finally {
	return next;
    }

};

const get = async function(req, res, next) {
    try {
	const { id } = req.params;

	const results = await db.query(
            `SELECT
               id,
               created,
               user_type,
               first_name,
               last_name,
               ST_X(location::geometry) AS latitude,
               ST_Y(location::geometry) AS longitude,
               location_updated,
               attributes
             FROM users
             WHERE obsolete = FALSE
               AND id = $1`,
	    [id]);

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		  'get user', user_id, results.rows[0]);

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

const device = async function(req, res, next) {
    try {
	const { device_token } = req.params;

	const results = await db.query(
            `SELECT * FROM devices WHERE device_token = $1`
	    [device_token]);

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		  'get device', null, device_token);

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

const location = async function(req, res, next) {
    try {
	const { id } = req.params;
	const { latitude, longitude } = req.body;

	await db.query(
	    `UPDATE users
             SET location_updated = now(),
               location = ST_SetSRID(ST_Point($2, $3), 4326)::geography
             WHERE id = $1
               AND obsolete = false`,
	    [id, longitude, latitude]);

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		  'update location', id, {latitude: latitude, longitude: longitude});

	res.json({success: true});

    }
    catch (e) {
	console.log(e);
	res.json({success: false, error: e.message});
    }
    finally {
	return next;
    }
};

const nearby = async function(req, res, next) {
    const radius = 2000; // in meters. make this adjustable later

    try {
	const { id } = req.params;

        const results = await db.query(
            `SELECT
               '123-456-7890' AS external_id, -- TODO: external_id from related contacts instead
               id
             FROM users
             WHERE
               ST_DWithin(location, (SELECT location FROM users WHERE id = $1), $2)
               AND id != $1`,
            [id, radius]);
        res.json(results.rows);

        log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
            'nearby', id,
            { results: results.rows.map((row) => row.external_id) });

    }
    catch (e) {
        console.log(e);
	res.json({success: false, error: e.message});
    }
    finally {
        return next;
    }
};

const verify = async function(req, res, next) {
    try {
	const { tmp_phone_number, code } = req.params;

	const phone_number = phoneUtil.parse(tmp_phone_number, 'US');
        if (!phoneUtil.isValidNumberForRegion(phone_number, 'US'))
            throw new Error(phoneUtil.format(phone_number, PNF.E164)+' isn\'t a valid US phone number.');

	let success = false;
        const results = await db.query(
            `SELECT attributes
             FROM phone_numbers
             WHERE phone_number = $1`,
            [phoneUtil.format(phone_number, PNF.E164)]);
	if (results.rows.length != 1)
	    throw new Error(phoneUtil.format(phone_number, PNF.E164)+' isn\'t in the database.');
	if (results.rows[0].attributes.code == code) {
	    console.log('code accepted - update db');
	    await db.query(
		`UPDATE phone_numbers
                 SET attributes = attributes::jsonb || jsonb_build_object('verified', true)
                 WHERE phone_number = $1`,
		[phoneUtil.format(phone_number, PNF.E164)]);
	    success = true;
	}

	res.json({success: success});
        log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
	    'verify', null, { success: success });

    }
    catch (e) {
        console.log(e);
	res.json({success: false, error: e.message});
        log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
	    'verify', null, { error: e.message });
    }
    finally {
        return next;
    }
};

module.exports = {
    create: create,
    get: get,
    location: location,
    nearby: nearby,
    verify: verify
};
