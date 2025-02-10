const db = require('../db');
const log = require('../log');
const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const emailValidator = require('email-validator');

module.exports = async function(req, res, next) {
    try {
	const { id } = req.params;
        const contacts = req.body;

        if (!Array.isArray(contacts))
            throw new Error('Body needs to be an array of contacts');

	await db.query('BEGIN');
	for (let x=0; x<contacts.length; x++) {
	    const contact = contacts[x];

	    if (!contact.external_id ||
		!contact.first_name || !contact.last_name ||
		!contact.company || !contact.job_title ||
		!Array.isArray(contact.phone_numbers) ||
		!Array.isArray(contact.email_addresses))
		throw new Error('Didn\'t get required fields. Expecting: external_id, '+
				'first_name, last_name, company, job_title, phone_numbers{}, email_addresses[]');

	    console.log('adding', contact.first_name, contact.last_name);
	    const contactResults = await db.query(
		`INSERT INTO contacts
                   (user_id, external_id, first_name, last_name, company, job_title)
                 VALUES
                   ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (user_id, external_id) DO UPDATE
                   SET external_id = EXCLUDED.external_id
                 RETURNING id`,
		[id, contact.external_id, contact.first_name,
		 contact.last_name, contact.company,
		 contact.job_title]);

	    const contact_id = contactResults.rows[0].id;

	    for (let y=0; y<contact.phone_numbers.length; y++) {
		const phone_number = phoneUtil.parse(contact.phone_numbers[y], 'US');
		if (!phoneUtil.isValidNumberForRegion(phone_number, 'US'))
                    throw new Error(phoneUtil.format(phone_number, PNF.E164)+' isn\'t a valid US phone number.');

		console.log('  ', phoneUtil.format(phone_number, PNF.E164));
		await db.query(
		    `INSERT INTO phone_numbers
                       (phone_number)
                     VALUES
                       ($1)
                     ON CONFLICT (phone_number) DO NOTHING`,
		    [phoneUtil.format(phone_number, PNF.E164)]);

		await db.query(
		    `INSERT INTO contact_2_phone_numbers
                       (contact_id, phone_number)
                     VALUES
                       ($1, $2)
                     ON CONFLICT (contact_id, phone_number) DO NOTHING`,
		    [contact_id, phoneUtil.format(phone_number, PNF.E164)]);
	    }

	    for (let y=0; y<contact.email_addresses.length; y++) {
		const email_address = contact.email_addresses[y];
		if (!emailValidator.validate(email_address))
                    throw new Error(email_address+' isn\'t a valid US phone number.');

		console.log('  ', email_address);
		await db.query(
		    `INSERT INTO email_addresses
                       (email_address)
                     VALUES
                       ($1)
                     ON CONFLICT (email_address) DO NOTHING`,
		    [email_address]);

		await db.query(
		    `INSERT INTO contact_2_email_addresses
                       (contact_id, email_address)
                     VALUES
                       ($1, $2)
                     ON CONFLICT (contact_id, email_address) DO NOTHING`,
		    [contact_id, email_address]);
	    }
	}
	console.log('done.');

	await log(req.headers['x-forwarded-for'] || req.connection.remoteAddress,
		  'contacts', id, {contacts:contacts.length});

	await db.query('COMMIT');
	res.json({success: true});

    }
    catch (e) {
	await db.query('ROLLBACK');
	console.log(e);
	res.json({success: false, error: e.message});
    }
    finally {
	return next;
    }
};
