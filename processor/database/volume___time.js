const derivedUnitsBuilder = require('../lib/derivedUnitsBuilder');
const volume = require('./volume');
const time = require('./time');

const data = {
    ...derivedUnitsBuilder(volume, time)
}

module.exports = data;
