const db = require('../db');

module.exports = async (ip, event_type, user_id, attributes) => {
    console.log(ip, event_type, user_id, JSON.stringify(attributes));

    if (!ip || !event_type || !attributes) // user_id can be null
	throw new Error('Missing parameters for logging: '+ip+', '+event_type+', '+attributes);

    await db.query(
        `INSERT INTO logs
           (ip, event_type, user_id, attributes)
         VALUES
           ($1, $2, $3, $4::json)`,
	[ip, event_type, user_id, attributes]);
};
