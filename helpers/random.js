const crypto = require('crypto');

exports.hash = function(howMany) {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const rnd = crypto.randomBytes(howMany);

    let value = new Array(howMany);

    for (var i=0; i<howMany; i++) {
        value[i] = chars[rnd[i] % chars.length]
    };

    return value.join('');
}

exports.integer = function(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
