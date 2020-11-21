const Telegraf = require.main.require('telegraf');
const _ = require.main.require('underscore');

const unitsProcessor = require('./processor');

//////////////////////////////////////////////////////////////////////
// const regexp = /^(?:([\d]+)[.,]?([\d]*))(?:\s)?((?:[^\s\/]+)(?:(?:\/|\sв\s|\sper\s)(?:[^\s\/]+))?)+(?:\s(?:-|in|to|into|в|сколько)?\s((?:[^\s\/]+)(?:(?:\/|\sв\s|\sper\s)(?:[^\s\/]+))?)$)?/i;
const regexp = /^(?:\/)?\s?((-?[\d]*)[.,]?([\d]*))([\s\S]+)$/i;
//////////////////////////////////////////////////////////////////////
console.log("LOCALCLCLALALCALCLA")
module.exports = {
    middleware: Telegraf.optional(noScenesEnteredTest, Telegraf.compose([
        Telegraf.hears(regexp, input),
        Telegraf.optional(callbackQueryTest, clarify)
    ])),
    locales: {
        'ru': require('./locales/ru.json'),
        'en': require('./locales/en.json')
    }
};

// LISTENER TO USER INPUT WITH NEEDED PATTERN
async function input(ctx, next) {
    let num;
    if (ctx.match[1]) {
        const baseNum = !isNaN(ctx.match[2]) ? ctx.match[2] : ctx.match[2] === '-' ? '-0' : 0;
        const afterPointNum = !isNaN(ctx.match[3]) ? ctx.match[3] : 0;
        num = parseFloat(String(baseNum) + '.' + String(afterPointNum));
    }
    const allUnitsString = ctx.match[4].trim();
    // const toUnits = ctx.match[4] && ctx.match[4].trim();
    // console.log(num, allUnitsString);
    let chat_id = getChatId(ctx);
    await ctx.telegram.sendChatAction(chat_id, 'typing');
    const t1 = Date.now();
    const result = await unitsProcessor.process(ctx, num, allUnitsString, null);
    const t2 = Date.now();
    console.log(`Request "${ctx.match[0]}" processed in ${t2 - t1} milliseconds`)
    await router(ctx, result);
    return next();
}

// LISTENER TO CALLBACKS FROM CLARIFYING QUERIES
async function clarify(ctx, next) {
    // console.log('WE GOT THAT');
    let chat_id = getChatId(ctx);
    await ctx.telegram.sendChatAction(chat_id, 'typing');
    let chosen = ctx.update.callback_query.data;
    const result = await unitsProcessor.clarify(ctx, chosen);
    await router(ctx, result);
    return next();
}

// ROUTER
async function router(ctx, result) {
    const TIMEDELAY = 500;
    if (!result || (!result.final && !result.clarify)) {
        console.error('No Final Result');
        return undefined;
    }
    let chat_id = getChatId(ctx);
    if (chat_id) {
        ctx.telegram.sendChatAction(chat_id, 'typing').then(() => {
            if (result.notice) {
                setTimeout(() => proceedNotice(ctx, result, chat_id), TIMEDELAY);
            } else proceedFinal(ctx, result);
        });
    } else proceedNotice(ctx, result)

    function proceedNotice(ctx, result, chat_id) {
        if (chat_id && result.notice) {
            ctx.replyWithHTML(...result.notice);
            ctx.telegram.sendChatAction(chat_id, 'typing').then(() => {
                setTimeout(() => proceedFinal(ctx, result, chat_id), TIMEDELAY);
            });
        } else proceedFinal(ctx, result)
    }

    function proceedFinal(ctx, result, chat_id) {
        if (chat_id) {
            ctx.telegram.sendChatAction(chat_id, 'typing').then(() => {
                setTimeout(() => {
                    if (result.final) ctx.replyWithHTML(...result.final);
                    if (result.clarify) ctx.replyWithHTML(...result.clarify);
                }, TIMEDELAY);
            });
        } else {
            if (result.final) ctx.replyWithHTML(...result.final);
            if (result.clarify) ctx.replyWithHTML(...result.clarify);
        }
    }

    // result can be a final result or list of variants with callbacks to clarify something
    // if (result.notice) {
    //     await ctx.replyWithHTML(...result.notice);
    // }
    // if (result.final) {
    //     await ctx.replyWithHTML(...result.final);
    // } else if (result.clarify) {
    //     await ctx.reply(...result.clarify);
    // }
}

function callbackQueryTest(ctx) {
    return ctx.update.callback_query &&
        ctx.update.callback_query.data &&
        unitsProcessor.callbackTest(ctx.update.callback_query.data);
}

function noScenesEnteredTest(ctx) {
    return !ctx.session.__scenes.current;
}

function getChatId(ctx) {
    let chat_id;
    try {
        chat_id = ctx.update.message ? ctx.update.message.chat.id : ctx.update.callback_query.from.id
    } catch (e) {
        console.log(e.message);
        return undefined;
    }
    return chat_id;
}
