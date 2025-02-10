const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
const port = 3000;
const prefix = '/api/v1';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post(prefix+'/user/create', routes.user.create);
app.get(prefix+'/user/:id', routes.user.get);
app.post(prefix+'/user/:id/contacts', routes.contacts);
//app.post(prefix+'/user/:id/sms/send', routes.sms);
app.put(prefix+'/user/:id/location', routes.user.location);
app.get(prefix+'/user/:id/nearby', routes.user.nearby);

app.get(prefix+'/device/:device_token', routes.device.get);

app.listen(port, () => console.log(`Listening on port ${port}!`));
