const _ = require.main.require('underscore');
const Extra = require.main.require('telegraf/extra');
const Markup = require.main.require('telegraf/markup');

class UnitsProcessor {
    constructor() {
        this._queryMaps = {};
        this._regexpMaps = {};
        this._bases = {};
        this.callbackPrefix = 'cnvrtr';
        this.callbackVariantsDelimeter = '--or--';
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
            this._bases[baseName] = {base};
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
            });
        });
        return this;
    }

    getUnits(query) {
        if (!query) return [];
        query = String(query) || '';
        const queryMatch = this._queryMaps[query];
        const regexpMatch = [];
        _.each(this._regexpMaps, tester => {
            if (tester.regexp.test(query)) {
                regexpMatch.push(...tester.units);
            }
        });
        return _.union(queryMatch, regexpMatch);
    }

    process(ctx, num, units, toUnits, options) {
        options = options || {unitsRaw: true};
        const lng = (text, opts) => {
            return ctx.i18n.t('__megaconverter.' + text, opts);
        }
        let from = options.unitsRaw ? this.getUnits(units) : units;
        let to = options.unitsRaw ? this.getUnits(toUnits) : toUnits;
        // special case when pattern treated for example('м в мм') as single unit description
        if (options.unitsRaw && !from.length && !to.length &&
            units.toLowerCase().includes(' в ')
        ) {
            let arr = units.split(' в ');
            if (arr.length === 2) {
                from = this.getUnits(arr[0]);
                to = this.getUnits(arr[1]);
            }
        }

        if (from.length) {
            if (from.length > 1) {
                // now check if we have TO Variants and it is defined
                if (to && to.length) {
                    from = this._filterSameUnitsType(to, from);
                    if (!from.length) {
                        return {final: [lng('unconvertable')]}
                    } else if (from.length === 1) {
                        // do nothing
                    } else return this._buildClarifyRequest(lng, num, from, to)
                } else return this._buildClarifyRequest(lng, num, from, to)
                // now check if we have some variants 2+ for from - build inline keyboard and ask to clarify
            }
            // ok, we have only one variant - proceed
            // now check if we have TO
            if (to.length) {
                // for to operand filter variants preserving only of the same type as from
                to = this._filterSameUnitsType(from, to);
                // if no to operands left after filter - give the final result
                if (!to.length) return this._buildFinalResults(lng, num, from)
                // if no to operands left after filter - give the final result
                if (!to.length) return this._buildFinalResults(lng, num, from)
                if (to.length > 1) {// check if we have many variants and - build inline keyboard to clarify TO what
                    return this._buildClarifyRequest(lng, num, from, to)
                } else { // if to operands is one - render final result
                    return this._buildFinalResults(lng, num, from, to)
                }
            } else {
                // if no TO operands - render final result
                return this._buildFinalResults(lng, num, from, to)
            }
        } else { // build no result and tip how to proper build results
            return this._buildFinalResults(lng, num, from, to)
        }
    }

    _filterSameUnitsType(from, to) {
        if (!to.length) return [];
        if (_.every(from, f => f.baseName === from[0].baseName)) {
            return _.filter(to, u => u.baseName === from[0].baseName);
        } else return to;
    }

    _buildClarifyRequest(lng, num, from, to) {
        let text, buttons;
        if (from && from.length > 1) {
            text = lng('clarify_from');
            buttons = this._buildButtons(lng, num, from, to, 'from')
        } else if (to) {
            to = this._filterSameUnitsType(from, to);
            text = lng('clarify_to') + ` ${lng(`_${from[0].baseName}.${from[0].id}`, {count: num})}`;
            buttons = this._buildButtons(lng, num, from, to, 'to')
        }
        if (text && buttons) {
            return {clarify: [text, buttons]}
        } else {
            return {final: [lng('tryAgain')]}
        }

    }

    _buildFinalResults(lng, num, from, to) {
        if (!from) return {final: [lng('noMatchFrom')]};

        from = from[0];
        to = to ? to[0] : undefined;
        const bN = from.baseName;
        //
        if (to) {
            const resNum = this._convert(num, from, to);
            return {final: [`${lng(`_${bN}.${from.id}`, {count: num})} = ${lng(`_${bN}.${to.id}`, {count: resNum})}`]}
        } else {
            const base = this._bases[from.baseName].base;
            const fromString = `<b>${lng(`_${bN}.${from.id}`, {count: num})}</b>`;
            const converts = _.map(base, u => {
                const result = this._convert(num, from, u);
                if (result / num > 10000000) return '';
                if (num / result > 10000000) return '';
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

    clarify(ctx, optionPicked) {
        let {num, fromBase, from, toBase, to} = this._dispatchCallbackResult(optionPicked);
        from = [this._bases[fromBase].base[from]];
        to = to ? _.map(to.split(this.callbackVariantsDelimeter), t => this._bases[toBase].base[t]) : [];

        return this.process(ctx, num, from, to, {unitsRaw: false});
    }

    _convert(num, from, to) {
        return num / from.r * to.r;
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
                        fromBase: varFrom.baseName,
                        from: varFrom.id,
                        toBase: to && to[0] && to[0].baseName,
                        to: to && to.length ? _.pluck(to, 'id').join(this.callbackVariantsDelimeter) : undefined
                    }))); // BUTTON ACTION)
            });
        } else if (iterate === 'to') {
            _.each(iterable, varTo => {
                buttons.push(Markup.callbackButton(
                    `${lng(`_${varTo.baseName}.${varTo.id}`, {count: 1}).substr(2)}`, // BUTTON TEXT
                    this._prepareCallbackString({
                        prefix: this.callbackPrefix,
                        num: num,
                        fromBase: from[0].baseName,
                        from: from[0].id,
                        toBase: varTo.baseName,
                        to: varTo.id,
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
        fromBase: 2,
        from: 3,
        toBase: 4,
        to: 5,
    }

    _prepareCallbackString(data = {}) {
        const indexes = this._dataIndexes;
        const dataArray = [];
        _.each(data, (v, k) => {
            if (!isNaN(indexes[k])) {
                dataArray[indexes[k]] = v;
            }
        });
        // console.log(dataArray);
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
            if (result[index]) res[key] = result[index];
        });
        return res;
    }

}

// DATABASES
const database = require('./database');

module.exports = new UnitsProcessor().register(database)

