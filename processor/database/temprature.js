const data = {
    celsius: {
        r: '(1-32)*(5/9)',
        query: [/^c(el(s(i(us|um)?)?)?)?$/i,/^d(eg(r(e(e(s)?)?)?)?)?\s?c(el(s(i(us|um)?)?)?)?$/i,'cls','clss','°C','°С',/^ц(ел(ь(с(и|ия|иев)?)?)?)?$/i,'цл','цлс',/^г(р(а(д(у(с(ов|а|ы|е)?)?)?)?)?)?\s?ц(ел(ь(с(и|ия|иев)?)?)?)?$/i]
    },
    fahrenheit: {
        r: '1',
        query: [/^f(a(h(r(en(h(ei(t(s)?)?)?)?)?)?)?)?$/i,/^d(eg(r(e(e(s)?)?)?)?)?\s?^f(a(h(r(en(h(ei(t(s)?)?)?)?)?)?)?)?$/i,'fh','fhrt','°F','°Ф',/^ф(а(р(ен(г(е(й(т(ов|а|ы|е)?)?)?)?)?)?)?)?$/i,'фг','фгт',/^г(р(а(д(у(с(ов|а|ы|е)?)?)?)?)?)?\s?ф(а(р(ен(г(е(й(т(ов|а|ы|е)?)?)?)?)?)?)?)?$/i]
    },
    kelvin: {
        r: '(1+459,67)*(5/9)',
        query: [/^k(e(l(v(in(s)?)?)?)?)?$/i,/^d(eg(r(e(e(s)?)?)?)?)?\s?k(e(l(v(in(s)?)?)?)?)?$/i,'kl','kls','K','К',/^к(е(л(ьв(ин(ов|а|ы|е)?)?)?)?)?$/i,'кл','клв',/^г(р(а(д(у(с(ов|а|ы|е)?)?)?)?)?)?\s?к(е(л(ьв(ин(ов|а|ы|е)?)?)?)?)??$/i]
    }
}

module.exports = data;