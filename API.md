# Arrive API

This is the API through which (mostly) mobile app users interact with the Arrive backend.

Users are generally mobile app users. (although can also be `administrator` users via the web) Users have any
number of phone numbers, email addresses, devices and contacts. At the moment, ONLY US PHONE NUMBERS ARE SUPPORTED.
Devices are identified by `device_token`s and can have many per user. Users can also be members of zero or more
groups.

## Usage

### Get Device

```GET http://localhost:3000/api/v1/device/<device_token>```

Before creating a user, you will want to make sure the device they are using isn't already associated with
someone else.

```
curl --header 'Content-Type: application/json' http://localhost:3000/api/v1/device/abc-123-xyz-789

{"success":true,"result":{"device_token":"abc-123-xyz-789","created":"2020-05-18T12:54:42.301Z","obsolete":false,"user_id":"7f611dc7-f309-44fa-914e-2f90f4690865","attributes":{}}}
```

### Create User

```POST http://localhost:3000/api/v1/user/create```

This endpoint creates users and sends a confirmation code to **the first of** the submitted phone numbers.

```
curl -X POST --header 'Content-Type: application/json' -d '{"first_name":"Joe","last_name":"Smith","phone_numbers":["2125551111","2125552222"],"email_addresses":["joe@example.com","jsmith@example.com"]}' http://localhost:3000/api/v1/user/create

{"success":true,"user_id":"f71c020f-e3a2-426d-93bc-9fee0cbec55a"}
```

### Add Contacts

```POST http://localhost:3000/api/v1/user/f71c020f-e3a2-426d-93bc-9fee0cbec55a/contacts```

You can add any number of contacts. This will add them if they are new or skip them if
they already exist so you don't need to worry about duplicates. The "external_id"
should remain the same for the same contact. (these IDs are usualy system generated)
```
curl -X POST --header 'Content-Type: application/json' -d '[{"external_id":"123-456-7890","first_name":"John","last_name":"Mahoney","company":"Acme, Inc.","job_title":"CEO","phone_numbers":["2125553333","2125554444"],"email_addresses":["john@example.com","jmahoney@example.com"]}]' http://localhost:3000/api/v1/user/f71c020f-e3a2-426d-93bc-9fee0cbec55a/contacts

{"success":true}
```

### Update Location

```PUT http://localhost:3000/api/v1/user/71cbf01e-76af-4102-8b78-ef4dcf27779f/location```

Update the user's latest location.
```
curl -X PUT --header 'Content-Type: application/json' -d '{"longitude":42.123,"latitude":-71.111}' http://localhost:3000/api/v1/user/71cbf01e-76af-4102-8b78-ef4dcf27779f/location

{"success":true}
```

### Nearby

```GET http://localhost:3000/api/v1/user/71cbf01e-76af-4102-8b78-ef4dcf27779f/nearby```

Get a list of external-ids which represent users (some real, most fake) that might be
near this user.
```
curl -X GET --header 'Content-Type: application/json' http://localhost:3000/api/v1/user/71cbf01e-76af-4102-8b78-ef4dcf27779f/nearby

[['123-456-7890', true],['123-456-9876', true],['123-456-1111', false],['123-456-2222', false],['123-456-3333', false],['123-456-4444', false]]
```
