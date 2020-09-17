const _ = require.main.require('underscore');
const Extra = require.main.require('telegraf/extra');
const Markup = require.main.require('telegraf/markup');

class UnitsProcessor {
    constructor() {
        this._queryMaps = {};
        this._regexpMaps = {};
        this._bases = {};
        this.callbackPrefix = 'cnvrtr';
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

    process(ctx, num, units, toUnits) {
        const lng = (text, opts) => {
            return ctx.i18n.t('__megaconverter.' + text, opts);
        }
        const from = this.getUnits(units);
        let to = this.getUnits(toUnits);

        if (from.length) {
            if (from.length > 1) {
                // now check if we have some variants 2+ for from - build inline keyboard and ask to clarify
                return {
                    clarify: this._buildClarifyRequest(lng, num, from)
                }
            }
            // ok, we have only one variant - proceed
            // now check if we have TO
            if (to.length) {
                // for to operand filter variants preserving only of the same type as from
                to = this._filterSameUnitsType(from, to);
                if (!to.length) return { // if no to operands left after filter - give the final result
                    final: this._buildFinalResults(lng, num, from)
                }
                if (to.length > 1) {// check if we have many variants and - build inline keyboard to clarify TO what
                    return {
                        clarify: this._buildClarifyRequest(lng, num, from, to)
                    }
                } else { // if to operands is one - render final result
                    return {
                        final: this._buildFinalResults(lng, num, from, to)
                    }
                }
            } else {
                return { // if no TO operands - render final result
                    final: this._buildFinalResults(lng, num, from)
                }
            }
        } else { // build no result and tip how to proper build results
            return {final: this._buildFinalResults(lng, num)};
        }
    }

    _filterSameUnitsType(from, to) {
        if (!to.length) return [];
        return _.filter(to, u => u.baseName === from[0].baseName);
    }

    _buildClarifyRequest(lng, num, from, to) {
        let text, buttons;
        if (to) {
            text = lng('clarify_to');
            buttons = this._buildButtons(lng, num, from, to, 'to')
        } else if (from) {
            text = lng('clarify_from');
            buttons = this._buildButtons(lng, num, from, to, 'from')
        }
        return [text, buttons];
    }

    _buildFinalResults(lng, num, from, to) {
        if (!from) return [lng('noMatch')];

        from = from[0];
        to = to ? to[0] : undefined;
        const bN = from.baseName;
        //
        if (to) {
            const resNum = this._convert(num, from, to);
            return [`${lng(`_${bN}.${from.id}`, {count: num})} = ${lng(`_${bN}.${to.id}`, {count: resNum})}`]
        } else {
            const base = this._bases[from.baseName].base;
            const fromString = `<b>${lng(`_${bN}.${from.id}`, {count: num})}</b>`;
            const converts = _.map(base, u => {
                if (u.id === from.id) return `&gt; <u>${lng(`_${bN}.${u.id}`, {count: this._convert(num, from, u)})}</u>\n`
                return `<b>${lng(`_${bN}.${u.id}`, {count: this._convert(num, from, u)})}</b>\n`;
            });
            const answer = `${fromString} = \n\n` + converts.join('');
            return [answer];
        }
    }

    clarify(ctx, optionPicked) {
        console.log(optionPicked);

        // here we recieve string from callback (this.callbackPrefix-<<num>>-<<from>>(-<<to>>)?)
        // clarified can be from or to we dont know and we dont need to know))
        // dispatch it
        // and put in process
        // done
    }

    _convert(num, from, to) {
        return num / from.r * to.r;
    }

    _buildButtons(lng, num, from, to, iterate) {
        const iterable = iterate === 'from' ? from : to;
        let buttons = [];
        _.each(iterable, varr => {
            buttons.push(Markup.callbackButton(iterable === 'from' ?
                `${lng(`_${varr.baseName}.${varr.id}`, {count: num})}` :
                `${lng(`_${from[0].baseName}.${from[0].id}`, {count: num})} > ${lng(`_${varr.baseName}.${varr.id}`, {count: 1})}`, // BUTTON TEXT
                this._prepareCallbackString({
                    prefix: this.callbackPrefix,
                    num: num,
                    from: iterable === 'from' ? varr.id : from[0].id,
                    to: iterable === 'to' ? varr.id : to ? to.id : undefined
                }))); // BUTTON ACTION)
        });
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

    _dataIndexes = {
        prefix: 0,
        num: 1,
        from: 2,
        to: 3,
    }

    _prepareCallbackString(data = {}) {
        const indexes = this._dataIndexes;
        const dataArray = [];
        _.each(data, (v, k) => {
            if (!isNaN(indexes[k])) {
                dataArray[indexes[k]] = v;
            }
        });
        return encodeURIComponent(JSON.stringify(dataArray))
    }

    _dispatchCallbackResult(callbackData) {
        let result;
        try {
            result = JSON.parse(decodeURIComponent(callbackData));
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

