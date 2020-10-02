const _ = require.main.require('underscore');

function buildDerivedUnits(main, secondary, options) {
    options = options || {};
    const delimeters = options.delimeters || [
        'в', 'per', '\/'
    ];
    const units = {};
    _.each(main, (mu, mkey) => {
        _.each(secondary, (su, skey) => {
            units[mkey + '__' + skey] = {
                r: `(${mu.r}) / (${su.r})`,
                query: mergeQueries(mu.query, su.query, delimeters)
            }
        })
    });
    return units;
}

function mergeQueries(mQ, sQ, dels) {
    const queries = [];
    const groupedMain = _.groupBy(mQ, groupper);
    const groupedSecondary = _.groupBy(sQ, groupper);
    // merge strings
    _.each(groupedMain['String'], mainString => {
        _.each(groupedSecondary['String'], secString => {
            queries.push(mainString + secString);
            _.each(dels, d => {
                queries.push(mainString + d + secString);
            });
        });
    });
    //merge regexps
    _.each(groupedMain['RegExp'], mainR => {
        _.each(groupedSecondary['RegExp'], secR => {
            queries.push(regexpMerge(mainR, secR, dels));
        });
    });
    return queries;
}

function regexpMerge(one, two, dels) {
    const first = trimmer(one.source);
    const second = trimmer(two.source);
    return new RegExp(`^${first}\s*(${dels.join('|')})?\s*${second}$`, 'i');
}

function trimmer(string) {
    let str = string;
    if (str[0] === "^") str = str.substr(1);
    if (str[str.length - 1] === "$") str = str.slice(0, -1);
    return str;
}

function groupper(query) {
    if (typeof query === 'string') return 'String';
    else return 'RegExp';
}

module.exports = buildDerivedUnits;
