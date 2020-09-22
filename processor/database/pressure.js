const data = {
    bar: {
        r: '1',
        query: [/^ba(r(s)?)?$/i,'br',/^ба(р(а|ов|ы|е|)?)?$/i,'бр']
    },
    millibar: {
        r: '1000',
        query: [/^mil(li(ba(r(s)?)?)?)?$/i,'millibr',/^мил(ли(ба(р(а|ов|ы|е|)?)?)?)?$/i,'миллибр']
    },
    kilopascal: {
        r: '100',
        query: [/^ki(l(o(p(as(cal(s)?)?)?)?)?)?$/i,'kpa','kp',/^ки(л(о(п(ас(кал(ь|я|ей|е)?)?)?)?)?)?$/i,'кпа','кп']
    },
    hectopascal: {
        r: '1000',
        query: [/^hec(t(o(p(as(cal(s)?)?)?)?)?)?$/i,'hpa','hp',/^ге(кт(о(п(ас(кал(ь|я|ей|е)?)?)?)?)?)?$/i,'гпа','гп']
    },
    megapascal: {
        r: '0.1',
        query: [/^me(g(a(p(as(cal(s)?)?)?)?)?)?$/i,'mpa','mp',/^ме(г(а(п(ас(кал(ь|я|ей|е)?)?)?)?)?)?$/i,'мпа','мп']
    },
    pascal: {
        r: '100000',
        query: [/^p(a(s(cal(s)?)?)?)?$/i,'pa','p',/^п(а(с(кал(ь|я|ей|е)?)?)?)?$/i,'па','п']
    },
    osi: {
        r: '232.1',
        query: [/^ou(nce(s)?)?\s?in(ch(es)?)?$/i,'osi','oz/in','ozin','ounce/inch','ounceinch',/^ун(ци(й|я|и)?)?\s?д(юй(м(е|а|ы|ов)?)?)?$/i,'унция/дюйм2','унция/дюйм','ун/дм','унция на квадратный дюйм']
    },
    psi: {
        r: '14.5',
        query: [/^p(ound(s)?)?\s?in(ch(es)?)?$/i,'psi','p/in','pin','pound/inch','poundinch',/^фу(нт(а|ов|ы)?)?\s?д(юй(м(е|а|ы|ов)?)?)?$/i,'фунт/дюйм2','фунт/дюйм','фт/дм','фунт на квадратный дюйм']
    },
    mmhg: {
        r: '750.1',
        query: ['mmhg','mmrtst','torr','ммртст','мм рт ст','миллиметров ртутного столба','торр']
    },
    atm_phys: {
        r: '0.9869',
        query: [/^a(t(m(os(ph(er(e(s)?)?)?)?)?)?)?$/i,/^p(h(ys(i(c(s)?)?)?)?)?\s?a(t(m(os(ph(er(e(s)?)?)?)?)?)?)?$/i,'physical atmosphere','physical atmospheres','patm',/^а(т(м(ос(ф(ер(а|ы|ов|е|у)?)?)?)?)?)?$/i,/^ф(из(ич(ес(к(их|ая|ую|ой)?)?)?)?)?\s?а(т(м(ос(ф(ер(а|ы|ов|е|у)?)?)?)?)?)?$/i]
    },
    atm_tech: {
        r: '1.02',
        query: [/^a(t(m(os(ph(er(e(s)?)?)?)?)?)?)?$/i,/^t(ec(h(n(i(c(al)?)?)?)?)?)?\s?a(t(m(os(ph(er(e(s)?)?)?)?)?)?)?$/i,'technical atmosphere','technical atmospheres','tatm',/^а(т(м(ос(ф(ер(а|ы|ов|е|у)?)?)?)?)?)?$/i,/^т(ех(н(ич(ес(к(их|ая|ую)?)?)?)?)?)?\s?а(т(м(ос(ф(ер(а|ы|ов|е|у)?)?)?)?)?)?$/i]
    },
    meter_water: {
        r: '10.2',
        query: ['meter of water column','metre of water column','meters of water column','metres of water column','mh2o','m h2o','water meter','метров водяного столба','метр водяного столба','мводст','м вод ст']
    },
    centimeter_water: {
        r: '1020',
        query: ['centimeter of water column','centimetre of water column','centimeters of water column','centimetres of water column','cmwc','cmh2o','cm h2o','water centimeter','сантиметров водяного столба','сантиметр водяного столба','смводст','см вод ст']
    },
    millimeter_water: {
        r: '10200',
        query: ['millimeter of water column','millimetre of water column','millimeters of water column','millimetres of water column','mmwc','mmh2o','mm h2o','water millimeter','миллиметров водяного столба','миллиметр водяного столба','ммводст','мм вод ст']
    },
    feet_water: {
        r: '33.46',
        query: ['feet of water column','feets of water column','fwc','fh2o','f h2o','water feet','water feets','фут водяного столба','футов водяного столба','фут водяного столба','фводст','ф вод ст']
    },
    inch_water: {
        r: '401.5',
        query: ['inch of water column','inches of water column','iwc','ih2o','i h2o','water inch','water inches','дюймов водяного столба','дюйм водяного столба','дводст','д вод ст']
    },

}

module.exports = data;
