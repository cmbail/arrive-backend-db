-- --------------------------------------------------------
-- -- Table: user_types
-- --
-- administrator, user, etc. but also used to cover future
-- types such as group administrator. (which is why it is
-- broken out as a table rather than an ENUM. also helps to
-- have an associated attributes column for holding things
-- like defaults)
-- --------------------------------------------------------
CREATE TABLE user_types (
  user_type          TEXT              NOT NULL UNIQUE,
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

INSERT INTO user_types (user_type) VALUES
  ('administrator'),
  ('user');

-- --------------------------------------------------------
-- -- Table: users
-- --
-- a user is a person who may have many devices, email
-- addresses or phone numbers.
-- --------------------------------------------------------
CREATE TABLE users (
  id                 UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_type          TEXT              NOT NULL REFERENCES user_types(user_type),
  encrypted_password TEXT, -- passwords are null for mobile app users
  first_name         TEXT              NOT NULL,
  last_name          TEXT              NOT NULL,
  company            TEXT,
  job_title          TEXT,
  location           GEOGRAPHY(POINT), -- this is the user's last known location
  location_updated   TIMESTAMP,        -- the last time at which this location was updated
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: devices
-- --
-- this relates devices to users. a single user may have
-- many devices. a device is (usually) a mobile phone but
-- could also be a tablet, watch, etc. this table has no id
-- column as the device token is our unique identifier.
-- --------------------------------------------------------
CREATE TABLE devices (
  device_token       TEXT              NOT NULL UNIQUE, -- provided by the mobile device OS
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_id            UUID              NOT NULL REFERENCES users(id),
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: phone_numbers
-- --
-- this relates phone numbers to users. a single user may
-- have many phone numbers. phone numbers are stored in
-- standard E.164 format enforced by the backend app. this
-- table does not have an id column as the phone number is
-- our unique identifier.
-- --------------------------------------------------------
CREATE TABLE phone_numbers (
  phone_number       TEXT              NOT NULL UNIQUE,
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_id            UUID              REFERENCES users(id),
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: email_addresses
-- --
-- this relates email addresses to users. a single user may
-- have many email addresses. this table does not have an
-- id column as the email address is our unique identifier
-- --------------------------------------------------------
CREATE TABLE email_addresses (
  email_address      TEXT              NOT NULL UNIQUE,
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_id            UUID              REFERENCES users(id),
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: contacts
-- --
-- this stores user's versions of their contact's names,
-- companies, job titles, etc. this will likely differ from
-- the versions of names in the users table. phone numbers
-- are kept in contact_phone_numbers and email addresses
-- are kept in contact_email_addresses.
-- --------------------------------------------------------
CREATE TABLE contacts (
  id                 UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_id            UUID              NOT NULL REFERENCES users(id),
  external_id        TEXT              NOT NULL, -- this is the unique identifier the mobile
                                                 -- operating system assigns to this contact
                                                 -- https://developer.apple.com/documentation/contacts/cncontact/1403103-identifier
  first_name         TEXT              NOT NULL,
  last_name          TEXT              NOT NULL,
  company            TEXT,
  job_title          TEXT,
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON,
  UNIQUE (user_id, external_id)
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: contact_2_phone_numbers
-- --
-- this associates contacts with (potentially many) phone
-- numbers.
-- --------------------------------------------------------
CREATE TABLE contact_2_phone_numbers (
  contact_id         UUID              NOT NULL REFERENCES contacts(id),
  phone_number       TEXT              NOT NULL REFERENCES phone_numbers(phone_number),
  UNIQUE(contact_id, phone_number)
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: contact_2_email_addresses
-- --
-- this associates contacts with (potentially many) email
-- addresses.
-- --------------------------------------------------------
CREATE TABLE contact_2_email_addresses (
  contact_id         UUID              NOT NULL REFERENCES contacts(id),
  email_address      TEXT              NOT NULL REFERENCES email_addresses(email_address),
  UNIQUE(contact_id, email_address)
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: groups
-- --
-- a group describes an arbitrary collection of users. an
-- administrator usually manages these. example: mit alumns
-- --------------------------------------------------------
CREATE TABLE groups (
  id                 UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  group_name         TEXT              NOT NULL,
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: users_2_groups
-- --
-- this associates users to groups. a group can consist of
-- any number of users and a user may be in any number of
-- groups.
-- --------------------------------------------------------
CREATE TABLE users_2_groups (
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  obsolete           BOOLEAN           NOT NULL DEFAULT FALSE,
  user_id            UUID              NOT NULL REFERENCES users(id),
  group_id           UUID              NOT NULL REFERENCES groups(id)
) WITH (OIDS=FALSE);

-- --------------------------------------------------------
-- -- Table: logs
-- --
-- this table logs every signifiant event for statistics,
-- debugging and machine learning purposes.
-- --------------------------------------------------------
CREATE TABLE logs (
  id                 UUID              NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  created            TIMESTAMP         NOT NULL DEFAULT now(),
  ip                 INET,             -- NULL if this is a system event
  event_type         TEXT              NOT NULL,
  user_id            UUID              REFERENCES users(id),
  attributes         JSON              NOT NULL DEFAULT '{}'::JSON -- everything interesting goes here
) WITH (OIDS=FALSE);
