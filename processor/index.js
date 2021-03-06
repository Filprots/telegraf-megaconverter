const _ = require.main.require('underscore');
const Extra = require.main.require('telegraf/extra');
const Markup = require.main.require('telegraf/markup');
const Math = require('mathjs');
const fetch = require('node-fetch');
const fx = require("money");
const moment = require("moment");

class UnitsProcessor {
    constructor() {
        this._queryMaps = {};
        this._regexpMaps = {};
        this._bases = {};
        this._basesKeysArray = [];
        this._unitsKeysIndexesInBaseMap = {};
        this.callbackPrefix = 'cnv';
        this.callbackVariantsDelimeter = '%';
        this._mathConfig = {
            number: 'BigNumber',
            // Number of significant digits for BigNumbers
            precision: 12
        }
        this._math = Math.create(Math.all, this._mathConfig);
    }

    _populateQueryMap(unit, query) {
        if (typeof query === 'string') {
            this._queryMaps[query] ?
                this._queryMaps[query].push(unit) :
                this._queryMaps[query] = [unit];
        } else if (query instanceof RegExp) {
            this._regexpMaps[query.toString()] ?
                this._regexpMaps[query.toString()].units.push(unit) :
                this._regexpMaps[query.toString()] = {
                    units: [unit],
                    regexp: query
                }
        }
    }

    register(units) {
        _.each(units, (base, baseName) => {
            // add base
            this._basesKeysArray.push(baseName);
            this._bases[baseName] = {
                base,
                baseUnit: _.find(base, u => String(u.r) === '1'), // detect base unit,
                unitsKeysArray: _.keys(base)
            };
            // inject map
            _.each(base, (u) => { // iterate units
                _.each(u.query, txt => { // iterate unit queries
                    this._populateQueryMap(u, txt);
                });
            });
            // bind parent base object to each unit
            _.each(base, (u, k) => {
                u.baseName = baseName;
                u.id = k;
                this._unitsKeysIndexesInBaseMap[k] = this._bases[baseName].unitsKeysArray.indexOf(k);
            });
        });
        return this;
    }

    getUnits(unitsString) {
        if (!unitsString) return [[], []];
        const self = this;
        // FIRST TRY FULL MATCH
        const fullMatch = getQueryResults(unitsString);
        if (fullMatch.length) return [fullMatch, []];
        // PARSE UNITS INPUT STRING (DETECT FROM AND TO UNITS)
        const ableDelimeters = [
            '-', ' in ', ' to ', ' into ', ' в ', ' сколько '
        ];
        let fromVariants = [];
        let toVariants = [];
        _.each(ableDelimeters, d => {
            const split = unitsString.split(d);
            _.each(split, (slice, index) => {
                if (split.length === 1) { // if variant is only one in this delimeter case
                    fromVariants.push(...getQueryResults(slice));
                } else if (!split[index + 1]) { // if this is last variant in series
                    fromVariants.push(...getQueryResults(unitsString));
                } else {
                    let breakingIndex = 0;
                    let first = '';
                    while (split[breakingIndex] && breakingIndex <= index) {
                        first && (first += d);
                        first += split[breakingIndex];
                        breakingIndex++;
                    }
                    breakingIndex = index + 1;
                    let rest = '';
                    while (split[breakingIndex]) {
                        rest && (rest += d);
                        rest += split[breakingIndex];
                        breakingIndex++;
                    }
                    fromVariants.push(...getQueryResults(first));
                    toVariants.push(...getQueryResults(rest));
                    // console.log(first, ' - ', rest);
                }
            });
        });

        // console.log("DETECTED FROM VARIANTS:\n", _.map(_.uniq(fromVariants), v => v.id));
        // console.log("DETECTED TO VARIANTS:\n", _.map(_.uniq(toVariants), v => v.id));
        return [_.uniq(fromVariants), _.uniq(toVariants)];

        function getQueryResults(query) {
            if (!query) return [];
            query = String(query).toLowerCase().trim() || '';
            const unSigned = String(query || '').toLowerCase().replace(/[^A-Za-zА-Яа-я0-9]/g, '');
            const queryMatch = self._queryMaps[query];
            const unSignedMatch = self._queryMaps[unSigned];
            const regexpMatch = [];
            _.each(self._regexpMaps, tester => {
                if (tester.regexp.test(query)) {
                    regexpMatch.push(...tester.units);
                }
                if (tester.regexp.test(unSigned)) {
                    regexpMatch.push(...tester.units);
                }
            });
            return _.union(queryMatch, unSignedMatch, regexpMatch);
        }
    }

    async process(ctx, num, units, toUnits, options) {
        options = options || {unitsRaw: true, silentFail: false};
        const lng = this._lngWrapper(ctx);
        let from, to;
        if (options.unitsRaw) {
            if (units.length > this._MAX_USER_UNPUT_LENGTH) return {final: [lng('unexpectedInput')]};
            [from, to] = this.getUnits(units);
        } else {
            from = units;
            to = toUnits;
        }
        // console.log('FROM-------------\n',from);
        // console.log('TO---------------\n',to);

        return await this._resolveConvertation(lng, num, from, to, options);
    }

    async _resolveConvertation(lng, num, from, to, options) {
        if (isNaN(num)) { // if num was not given,
            num = 1
            options.silentFail = true;
        }

        if (!from.length) return await this._buildFinalResults(lng, num, [], [], options);

        if (from.length === 1) { // if only one variant from
            if (to.length) { // if we have options to what
                to = this._filterSameUnitsType(from[0].baseName, to); // filter only matching for given from
                if (to.length) {
                    if (to.length > 1) return this._buildClarifyRequest(lng, num, from, to, options); // clarify which TO
                    else return await this._buildFinalResults(lng, num, from, to, options); // TO option is only one
                } else return await this._buildFinalResults(lng, num, from, [], options); // all TO options gone
            } else return await this._buildFinalResults(lng, num, from, [], options); // no TO options given
        } else { // if many from variants
            if (!to.length) return this._buildClarifyRequest(lng, num, from, [], options); // if no TO variants at all (even without filtering)
            else { // if we have many from and many to (here we need to find out if we have matching from-to pairs)
                let matchingTo = [];
                // preserve only that TOes that mactch some of FROMs
                _.each(from, fromUnit => {
                    matchingTo.push(..._.filter(to, toUnit => fromUnit.baseName === toUnit.baseName));
                });
                matchingTo = _.uniq(matchingTo);
                // in case we have same TO baseNames, check if when we filter FROM and only variant stays
                if (matchingTo.length && (matchingTo.length === 1 || _.every(matchingTo, tu => _.some(from, fu => tu.baseName === fu.baseName)))) {
                    const matchingFrom = this._filterSameUnitsType(_.map(matchingTo, mt => mt.baseName), from);
                    console.log("DETECTED MATCHNIG FROM VARIANTS:\n", _.map(matchingFrom, v => v.id));
                    console.log("DETECTED MATCHING TO VARIANTS:\n", _.map(matchingTo, v => v.id));
                    if (matchingFrom.length === 1 && matchingTo.length === 1) return await this._buildFinalResults(lng, num, matchingFrom, matchingTo, options);
                    else return this._buildClarifyRequest(lng, num, matchingFrom, matchingTo, options);
                }
                // else clarify FROM and TO
                return this._buildClarifyRequest(lng, num, from, matchingTo, options);
            }
        }
    }

    _filterSameUnitsType(baseNames, toFilter) {
        if (!toFilter || !toFilter.length) return [];
        if (!Array.isArray(baseNames)) baseNames = [baseNames];
        return _.filter(toFilter, u => baseNames.includes(u.baseName));
    }

    _buildClarifyRequest(lng, num, from, to, options) {
        let text, buttons;
        if (from && from.length > 1) {
            to = this._filterSameUnitsType(_.map(from, fu => fu.baseName), to);
            text = lng('clarify_from');
            buttons = this._buildButtons(lng, num, from, to, 'from')
        } else if (to && to.length > 1) {
            to = this._filterSameUnitsType(_.map(from, fu => fu.baseName), to);
            text = lng('clarify_to') + ` ${lng(`_${from[0].baseName}.${from[0].id}`, {count: num})}`;
            buttons = this._buildButtons(lng, num, from, to, 'to')
        }
        // console.log(num, from, to);
        if (text && buttons) {
            return {clarify: [text, buttons]}
        } else {
            if (!options.silentFail) {
                return {final: [lng('tryAgain')]}
            } else return undefined;
        }

    }

    async _buildFinalResults(lng, num, from, to, options) {
        if (!from || !from.length) {
            if (!options.silentFail) {
                return {final: [lng('noMatchFrom')]};
            } else return undefined;
        }

        from = from[0];
        to = to ? to[0] : undefined;
        const bN = from.baseName;
        // CURRENCY RATES CASE
        if (from.isCurrency) {
            if (!to || !to.isCurrency) return {
                final: [lng('needToCurrency')]
            }
            const resNum = await this._convertCurrency(num, from, to);
            moment.locale(lng('getLocale'));
            // console.log(lng('getLocale'))
            const date = moment(this._currencyUpdatedTimestamp).format('LLL');
            return {final: [`<b>${lng(`_${bN}.${from.id}`, {count: num})} = ${lng(`_${bN}.${to.id}`, {count: resNum})}</b>\n\n${lng('currencyTime')} ${date}\n(${lng('currencySponsor')})`]}
        }
        // OTHER UNITS
        if (to) {
            const resNum = this._convert(num, from, to);
            return {final: [`${lng(`_${bN}.${from.id}`, {count: num})} = ${lng(`_${bN}.${to.id}`, {count: resNum})}`]}
        } else {
            const base = this._bases[from.baseName].base;
            const fromString = `<b>${lng(`_${bN}.${from.id}`, {count: num})}</b>`;
            const converts = _.map(base, u => {
                const result = this._convert(num, from, u);
                if (result / num > 100000) return '';
                if (num / result > 100000) return '';
                if (u.id === from.id) return `&gt; <u>${lng(`_${bN}.${u.id}`, {count: result})}</u>\n`
                return `<b>${lng(`_${bN}.${u.id}`, {count: result})}</b>\n`;
            });
            const answer = `${fromString} = \n\n` + converts.join('');
            return {
                notice: [lng('noToGiven')],
                final: [answer]
            };
        }
    }

    async clarify(ctx, optionPicked) {
        let {num, unitsBase, from, to} = this._dispatchCallbackResult(optionPicked);
        from = [this._bases[unitsBase].base[this._bases[unitsBase].unitsKeysArray[from]]];
        to = to ? _.compact(_.map(to.split(this.callbackVariantsDelimeter), t => this._bases[unitsBase].base[this._bases[unitsBase].unitsKeysArray[t]])) : [];

        return await this.process(ctx, num, from, to, {unitsRaw: false});
    }

    _convert(num, from, to) {
        // THIS IS AT WHAT JAVASCRIPT SUCKS - MATHEMATICS
        // console.log(num / from.r * to.r);
        // SO WE USE mathjs
        if (from.r === to.r) return num;
        // console.log(this._math.evaluate(`${num} / (${from.r}) * (${to.r})`));
        // return this._math.format(this._math.evaluate(`${num} / (${from.r}) * (${to.r})`));
        // find base unit
        let {baseUnit} = this._bases[from.baseName];
        let basedNum, finalNum;
        // turn from to base units
        if (from === baseUnit) basedNum = num;
        else if (from.difference) basedNum = this._math.evaluate(from.r[0].replace(/x/i, num));
        else basedNum = this._math.evaluate(`${num} / (${from.r}) * 1`);
        // turn base units to to
        if (to === baseUnit) finalNum = basedNum;
        else if (to.difference) finalNum = this._math.evaluate(to.r[1].replace(/x/i, basedNum));
        else finalNum = this._math.evaluate(`${basedNum} / 1 * (${to.r})`);
        // return finalNum;
        const decPl = finalNum.decimalPlaces();
        return this._math.round(finalNum, decPl > 5 ? decPl - 1 : decPl);
    }

    async _convertCurrency(num, from, to) {
        await this._updateCurrencyRates();
        let FROM = from.r;
        let TO = to.r;
        return fx(num).from(FROM).to(TO);
    }

    _currencyUpdateTimeout = 60000;
    _currencyUpdated = false;
    _currencyUpdatedTimestamp = undefined;
    _currencyRates = {
        USD: 1
    };
    _currencyBase = 'USD';

    async _updateCurrencyRates() {
        const oxrapis = [
            'https://irrisketch.ru/oxr',
            'https://irrisketch.com/oxr'
        ];
        if (!this._currencyUpdated) {
            for (const api_endpoint of oxrapis){
                try {
                    // console.log(`Trying to fetch OXR from api-endpoint ${api_endpoint}`);
                    const response = await fetch(api_endpoint);
                    const result = await response.json();
                    this._updateCurrenciesSettings(result);
                    // mark currencies as updated and expire in given timeout
                    this._currencyUpdated = true;
                    setTimeout(() => {
                        this._currencyUpdated = false
                    }, this._currencyUpdateTimeout);
                    return;
                } catch (e) {
                    console.log(`Api endpoint ${api_endpoint} is unavailable`);
                }
            }
            console.log(`None of given endpoints are available`);
        }
    }

    _updateCurrenciesSettings(data) {
        fx.rates = data.rates;
        fx.base = data.base;
        this._currencyRates = data.rates;
        this._currencyBase = data.base;
        this._currencyUpdatedTimestamp = data.timestamp * 1000;
    }

    _buildButtons(lng, num, from, to, iterate) {
        const iterable = iterate === 'from' ? from : to;
        let buttons = [];

        if (iterate === 'from') {
            _.each(iterable, varFrom => {
                buttons.push(Markup.callbackButton(`${lng(`_${varFrom.baseName}.${varFrom.id}`, {count: num})}`,
                    this._prepareCallbackString({
                        prefix: this.callbackPrefix,
                        num: num,
                        unitsBase: varFrom.baseName,
                        from: varFrom.id,
                        to: to && to.length ? _.pluck(_.reject(to, tu => tu.baseName !== varFrom.baseName), 'id') : undefined
                    }))); // BUTTON ACTION)
            });
        } else if (iterate === 'to') {
            _.each(iterable, varTo => {
                buttons.push(Markup.callbackButton(
                    `${lng(`_${varTo.baseName}.${varTo.id}`, {count: 1}).substr(2)}`, // BUTTON TEXT
                    this._prepareCallbackString({
                        prefix: this.callbackPrefix,
                        num: num,
                        unitsBase: from[0].baseName,
                        from: from[0].id,
                        to: [varTo.id],
                    }))); // BUTTON ACTION)
            });
        }
        buttons = divideIntoLines(buttons);

        return Extra.HTML().markup(m => m.inlineKeyboard(buttons));

        function divideIntoLines(buttons) {
            const maxInARow = 1;
            if (buttons.length < maxInARow) return buttons;
            const splitted = [];
            while (buttons.length > 0)
                splitted.push(buttons.splice(0, maxInARow));
            return splitted;
        }
    }

    callbackTest(clb) {
        try {
            clb = JSON.parse(clb);
            return clb[0] === this.callbackPrefix;
        } catch (e) {
            return false;
        }
    }

    _dataIndexes = {
        prefix: 0,
        num: 1,
        unitsBase: 2,
        from: 3,
        to: 4,
    }

    _dataIndexGetters = {
        unitsBase: (baseName) => {
            return this._basesKeysArray.indexOf(baseName);
        },
        from: (fromUnitsKey) => {
            return this._unitsKeysIndexesInBaseMap[fromUnitsKey];
        },
        to: (arrayOfToUnitsKeys) => {
            if (!arrayOfToUnitsKeys || !arrayOfToUnitsKeys.length) return undefined;
            return _.map(arrayOfToUnitsKeys, tou => this._unitsKeysIndexesInBaseMap[tou]).join(this.callbackVariantsDelimeter);
        }
    }

    _dataNamesGetters = {
        unitsBase: (baseIndex) => {
            return this._basesKeysArray[baseIndex];
        }
    }

    _prepareCallbackString(data = {}) {
        const indexes = this._dataIndexes;
        const dataArray = [];
        _.each(data, (v, k) => {
            if (!isNaN(indexes[k])) {
                if (this._dataIndexGetters[k]) v = this._dataIndexGetters[k](v);
                dataArray[indexes[k]] = v;
            }
        });
        console.log(dataArray);
        return JSON.stringify(dataArray)
    }

    _dispatchCallbackResult(callbackData) {
        let result;
        try {
            result = JSON.parse(callbackData);
        } catch (e) {
            return false;
        }
        const res = {};
        _.each(this._dataIndexes, (index, key) => {
            if (result[index] || result[index] === 0) {
                let val = result[index];
                if (this._dataNamesGetters[key]) val = this._dataNamesGetters[key](val);
                res[key] = val;
            }
        });
        return res;
    }

    _lngWrapper = ctx => (text, opts) => {
        if (text === 'getLocale') {
            return ctx.i18n.locale();
        }
        let translation;
        try {
            translation = ctx.i18n.t('__megaconverter.' + text, opts);
        } catch (e) {
            // maybe we have here derived units (so build then up)
            if (!translation) {
                let requested = text.split('.');
                if (requested.length === 2) {
                    let [baseNames, unitsKeys] = _.map(requested, piece => piece.split('__'));
                    let first = ctx.i18n.t('__megaconverter.' + baseNames[0] + '.' + unitsKeys[0], opts);
                    let second = ctx.i18n.t('__megaconverter.' + baseNames[1] + '.' + unitsKeys[1], {count: 1}).substr(2);
                    translation = first + ' / ' + second;
                }
            }
        }
        return translation || 'UNDEFINED2';
    }
}

// DATABASES
const database = require('./database');

module.exports = new UnitsProcessor().register(database)

