const Telegraf = require.main.require('telegraf');
const _ = require.main.require('underscore');

const unitsProcessor = require('./processor');

//////////////////////////////////////////////////////////////////////
const regexp = /^(?:([\d]+)[.,]?([\d]*))(?:\s)?((?:[^\s\/]+)(?:(?:\/|\sв\s|\sper\s)(?:[^\s\/]+))?)+(?:\s(?:-|in|to|into|в|сколько)?\s((?:[^\s\/]+)(?:(?:\/|\sв\s|\sper\s)(?:[^\s\/]+))?)$)?/i;
//////////////////////////////////////////////////////////////////////
console.log("LOADIN LOCAL MEGACONVERTER");
module.exports = {
    middleware: Telegraf.compose([
        Telegraf.hears(regexp, input),
        Telegraf.optional(callbackQueryTest, clarify)
    ]),
    locales: {
        'ru': require('./locales/ru.json')
    }
};

// LISTENER TO USER INPUT WITH NEEDED PATTERN
async function input(ctx, next) {
    const num = parseFloat((+ctx.match[1] || 0) + '.' + (String(ctx.match[2]) || '0'));
    const units = ctx.match[3];
    const toUnits = ctx.match[4] && ctx.match[4].trim();
    console.log(num, units, toUnits);
    const result = unitsProcessor.process(ctx, num, units, toUnits);
    await router(ctx, result);
    return next();
}

// LISTENER TO CALLBACKS FROM CLARIFYING QUERIES
async function clarify(ctx, next) {
    console.log('WE GOT THAT');
    let chosen = ctx.update.callback_query.data;
    const result = unitsProcessor.clarify(ctx, chosen);
    await router(ctx, result);
    return next();
}

// ROUTER
async function router(ctx, result) {
    // result can be a final result or list of variants with callbacks to clarify something
    if (result.final) {
        await ctx.replyWithHTML(...result.final);
    } else if (result.clarify) {
        await ctx.reply(...result.clarify);
    }
}

function callbackQueryTest(ctx) {
    return ctx.update.callback_query &&
        ctx.update.callback_query.data &&
        ctx.update.callback_query.data.substring(0, unitsProcessor.callbackPrefix.length) === unitsProcessor.callbackPrefix;
}

