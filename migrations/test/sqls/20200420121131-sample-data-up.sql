-- several test users around boston / cambridge / brookline
INSERT INTO users
  (user_type, first_name, last_name, location, location_updated)
VALUES
  ('user', 'One', 'Fish', ST_MakePoint(42.364004, -71.084102)::geography, now()),
  ('user', 'Two', 'Fish', ST_MakePoint(42.355252, -71.054920)::geography, now()),
  ('user', 'Red', 'Fish', ST_MakePoint(42.361263, -71.071451)::geography, now()),
  ('user', 'Blue', 'Fish', ST_MakePoint(42.334620, -71.117113)::geography, now());

-- -- to find all the users within 2000 meters of 42.361092, -71.087366:
-- SELECT
--   first_name,
--   last_name,
--   ST_X(location::geometry) AS long,
--   ST_Y(location::geometry) AS lat
-- FROM users
-- WHERE ST_DWithin(location, ST_MakePoint(42.361092, -71.087366)::geography, 2000);
--
-- this should return two users, One Fish and Red Fish

-- tie in some phone numbers
INSERT INTO phone_numbers
  (phone_number, user_id)
VALUES
  ('+16175551212', (SELECT id FROM users WHERE first_name='One' AND last_name='Fish' LIMIT 1)),
  ('+15165551212', (SELECT id FROM users WHERE first_name='Two' AND last_name='Fish' LIMIT 1)),
  ('+16475551212', (SELECT id FROM users WHERE first_name='Red' AND last_name='Fish' LIMIT 1)),
  ('+12125551212', (SELECT id FROM users WHERE first_name='Blue' AND last_name='Fish' LIMIT 1));

-- tie in some email addresses
INSERT INTO email_addresses
  (email_address, user_id)
VALUES
  ('one-fish@example.com', (SELECT id FROM users WHERE first_name='One' AND last_name='Fish' LIMIT 1)),
  ('two-fish@example.com', (SELECT id FROM users WHERE first_name='Two' AND last_name='Fish' LIMIT 1)),
  ('red-fish@example.com', (SELECT id FROM users WHERE first_name='Red' AND last_name='Fish' LIMIT 1)),
  ('blue-fish@example.com', (SELECT id FROM users WHERE first_name='Blue' AND last_name='Fish' LIMIT 1));
