const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

//const number = phoneUtil.parseAndKeepRawInput('2125551212', 'US');
const number = phoneUtil.parse('2125551212', 'US');

console.log(phoneUtil.isValidNumberForRegion(number, 'US'));
console.log(phoneUtil.format(number, PNF.E164));
