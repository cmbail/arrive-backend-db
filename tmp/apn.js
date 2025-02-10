const apn = require('apn');
const config = require('../config');

const options = {
    token: {
	key: config.apn.key,
	keyId: config.apn.keyId,
	teamId: config.apn.teamId
    },
    production: false
};
console.log(options);
const apnProvider = new apn.Provider(options);

let note = new apn.Notification();
note.expiry = Math.floor(Date.now() / 1000) + 3600; // Expires 1 hour from now.
note.badge = 3;
note.sound = 'ping.aiff';
note.alert = '\uD83D\uDCE7 \u2709 You have a new message';
note.payload = {'messageFrom': 'John Appleseed'};
note.topic = config.apn.bundleId;

const deviceTokens = ['a9d0ed10e9cfd022a61cb08753f49c5a0b0dfb383697bf9f9d750a1003da19c7'];

apnProvider.send(note, deviceTokens).then((res) => {
    console.log(res);
});
