const ccxt = require('ccxt');
const fetch = require('node-fetch');

require('dotenv').config();

const apiKey = process.env.API_KEY;
const secret = process.env.API_SECRET;
const webhookUrl = process.env.WEBHOOK_URL;
const symbol = process.env.SYMBOL;
const amount = process.env.AMOUNT;
const currency = process.env.CURRENCY;
const day = Number(process.env.DAY);
const hour = Number(process.env.HOUR);
const TEST = process.env.TEST || false;

const HOUR = 60*60*1000;

const kraken = new ccxt.kraken({
    apiKey,
    secret
});

const placeOrder = async () => {
    const date = new Date();

    if (date.getUTCDay() !== day || date.getUTCHours() !== hour) {
        console.log("Not valid time.");
        return;
    }

    const balance = await kraken.fetchBalance();

    if (balance[currency].total < amount) {
        console.log("Not enough funds.");
        return;
    }

    const trades = await kraken.fetchMyTrades(symbol, new Date().getTime() - 24*HOUR);

    if (trades.find(trade => trade.cost === amount)) {
        console.log("Trade already placed.")
        return;
    }

    const orders = await kraken.fetchOpenOrders(symbol, new Date().getTime() - 2*HOUR);

    if (orders.length) {
        console.log("Similar order already exists.")
        return;
    }

    const ticker = await kraken.fetchTicker(symbol);
    const basePrice = ticker.last;
    const quoteAmount = kraken.amountToPrecision(symbol, amount / basePrice);

    const order = TEST
        ? await kraken.createLimitOrder(symbol, "buy", quoteAmount, 1)
        : await kraken.createMarketOrder(symbol, "buy", quoteAmount);

    const orderName = order.info.descr.order;

    console.log(orderName);

    if (!webhookUrl) {
        return;
    }

    // IFTTT webhook
    await fetch(webhookUrl, {
        method: 'post',
        body: JSON.stringify({ value1: orderName }),
        headers: { 'Content-Type': 'application/json' },
    })
        .then(() => console.log("Email successfully sent."))
        .catch(() => console.log("Email sending failed."));
};

placeOrder();
