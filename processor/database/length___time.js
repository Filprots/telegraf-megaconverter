const derivedUnitsBuilder = require('../lib/derivedUnitsBuilder');
const length = require('./length');
const time = require('./time');

const data = {
    ...derivedUnitsBuilder(length, time)
}

// console.log(data);

module.exports = data;
