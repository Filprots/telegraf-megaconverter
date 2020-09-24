const data = {
    kilogram: {
        r: '1',
        query: [/^k(il(o(gr(am(e|s|es)?)?)?)?)?$/i,'kg','klgrm','klg',/^к(ил(о(г(р(а(м(м(ов|а|e|ы)?)?)?)?)?)?)?)?$/i,'кг','клг','клгрм']
    },
    centner: {
        r: '0.01',
        query: [/^c(en(t(n(er(s)?)?)?)?)?$/i,'cnt','cntnr',/^ц(ен(т(н(ер(ов|а|e|ы)?)?)?)?)?$/i,'цн','цнтр','цнт']
    },
    tonn: {
        r: '0.001',
        query: [/^t(on(ns|e|n)?)?$/i,'tn','tns',/^т(он(н(а|ы|е)?)?)?$/i,'тн']
    },
    kilotonn: {
        r: '0.000001',
        query: [/^kilot(on(ns|e|n)?)?$/i,'tn','tns','klt','kltn','kilt','kiltns',/^килот(он(н(а|ы|е)?)?)?$/i,'тн','ктн']
    },
    karat: {
        r: '5000',
        query: [/^ka(r(a(t(s)?)?)?)?$/i,/^сa(r(a(t(s)?)?)?)?$/i,'сts','kts',/^кар(а(т(ов|а|е|ы)?)?)?$/i,'крт']
    },
    gram: {
        r: '1000',
        query: [/^gr(am(e|s|es|me|ms|mes)?)?$/i,'grm','grms',/^г(р(а(м(мов|ма|мe|мы|ов|а|e|ы)?)?)?)?$/i,'г','гр','грм']
    },
    centigram: {
        r: '100000',
        query: [/^centigr(am(e|s|es|me|ms|mes)?)?$/i,'cgrm','cgrms','cengrm','cengrms',/^сантиг(р(а(м(мов|ма|мe|мы|ов|а|e|ы)?)?)?)?$/i,'сг','сгр','сгрм']
    },
    milligram: {
        r: '1000000',
        query: [/milligr(am(e|s|es|me|ms|mes)?)?$/i,'mgrm','mgrms','milligrm','milligrms',/^миллиг(р(а(м(мов|ма|мe|мы|ов|а|e|ы)?)?)?)?$/i,'мг','мгр','мгрм']
    },
    microgram: {
        r: '1000000000',
        query: [/^microgr(am(e|s|es|me|ms|mes)?)?$/i,'mcgrm','mcgrms','microgrm','microgrms',/^микрог(р(а(м(мов|ма|мe|мы|ов|а|e|ы)?)?)?)?$/i,'мкг','мкгр','мкгрм']
    },
    pound: {
        r: '2.205',
        query: [/^p(ou(nd(s)?)?)?$/i,'lb','lbs','pnds','pn',/^ф(ун(т(а|ы|е|ов)?)?)?$/i,'фт','лб','лбс']
    },
    ounce: {
        r: '35.27',
        query: [/^o(un(c(e(s)?)?)?)?$/i,'oz',/^у(н(ц(ия|ии|ий|ие)?)?)?/i,'оз']
    }
}

module.exports = data;
