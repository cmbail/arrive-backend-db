module.exports = {
    postgres: {
	host: process.env.PGHOST || 'localhost',
	database: process.env.PGDATABASE || 'arrive_dev',
	user: process.env.PGUSER || 'arrive',
	password: process.env.PGPASSWORD || '',
	ssl: false,
	debug: false
    },
    apn: {
	key: process.env.APN_KEY,
	keyId: process.env.APN_KEYID,
	teamId: process.env.APN_TEAMID,
	bundleId: process.env.APN_BUNDLEID
    }
}
