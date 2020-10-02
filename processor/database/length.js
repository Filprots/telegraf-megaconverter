const data = {
    angstr: {
        r: '10000000000',
        query: [/^a(n(g(s(t(r(em(s)?)?)?)?)?)?)?$/i, /^а(н(г(с(т(р(ем(ов|а|ы)?)?)?)?)?)?)?$/i, 'a', 'a']
    },
    nanom: {
        r: '1000000000',
        query: [/^nan(om(etre|eter(s)?)?)?$/i, 'nm', 'nmts', /^нан(ом(етр(ов|а|ы)?)?)?$/i, 'нм', 'нмтр']
    },
    micron: {
        r: '1000000',
        query: [/^mic(ro(m(etre|eter(s)?)?)?)?$/i, 'mcm', 'mcmts', /^micron(s)?$/i, 'mcs', /^мик(ро(м(етр(ов|а|ы)?)?)?)?$/i, 'мкм', 'мкмтр', /^микрон(ов|а|ы)$/i]
    },
    millim: {
        r: '1000',
        query: [/^mill(i(m(etre|eter(s)?)?)?)?$/i, 'mm', 'mmts', /^милл(и(м(етр(ов|а|ы)?)?)?)?$/i, 'мм', 'ммтр']
    },
    centim: {
        r: '100',
        query: [/^cen(ti(m(etre|eter(s)?)?)?)?$/i, 'cm', 'cmts', /^сан(ти(м(етр(ов|а|ы)?)?)?)?$/i, 'см', 'смтр']
    },
    decim: {
        r: '10',
        query: [/^dec(i(m(etre|eter(s)?)?)?)?$/i, 'dm', 'dmts', /^дец(и(м(етр(ов|а|ы)?)?)?)?$/i, 'дм', 'дмтр']
    },
    metr: {
        r: '1',
        query: [/^m(etre|eter(s)?)?$/i, 'mts', /^м(ет(р(ов|а|ы)?)?)?$/i, 'мтр', 'м']
    },
    kilom: {
        r: '1/1000',
        query: [/^kil(o(m(etre|eter(s)?)?)?)?$/i, 'km', 'kmts', /^кил(о(м(етр(ов|а|ы)?)?)?)?$/i, 'км', 'кмтр']
    },
    milya: {
        r: '1/1609',
        query: [/^mil(e(s)?)?$/i, 'mils', /^мил(ь|я|и)?$/i, 'мл']
    },
    yard: {
        r: '1.094',
        query: [/^y(ar(d(s)?)?)?$/i, 'yd', 'yds', 'yrds', /^я(рд(ов|а|ы)?)?$/i]
    },
    feet: {
        r: '3.281',
        query: ['foot', /^f(ee(t(s)?)?)?$/i, 'ft', 'fts', /^ф(ут(ов|а|ы)?)?$/i]
    },
    inch: {
        r: '3.281*12',
        query: [/^i(n(c(h(e(s)?)?)?)?)?$/i, 'inchs', /^д(юйм(ов|а|ы)?)?$/i]
    }
}

module.exports = data;
