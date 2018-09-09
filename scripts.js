'use strict';
const Gdax = require('gdax');
const pass = require('./pass.js')
const publicClient = new Gdax.PublicClient();
const key = pass.key;
const secret = pass.secret;
const passphrase = pass.passphrase;
const apiURI = 'https://api.gdax.com';
const accountID = pass.accountID;
const authedClient = new Gdax.AuthenticatedClient(key, secret, passphrase, apiURI);
//holds current BTC value, benchmark value
const buySellData = {
  benchMarkPriceETH: 0,
  currentPriceETH: 0,
  boughtPriceETH: 195.59,
};
let bought = true;
//Parameters to pass into the buy method
//Needs to have product ID be a variable
const buyParams = {
  side: 'buy',
  type: 'limit',
  time_in_force: 'GTT',
  cancel_after: 'day',
  price: 0,
  size: 0,
  product_id: 'ETH-USD'
};

//Params to pass into sell method
//Needs to have product ID be a variable
const sellParams = {
  side: 'sell',
  type: 'limit',
  time_in_force: 'GTC',
  price: 0,
  size: 0,
  product_id: 'ETH-USD'
};

//kick it off
const start = async () => {
  try {
    let dataETH = await authedClient.getProductTicker('ETH-USD');
    buySellData.benchMarkPriceETH = dataETH.ask;
    buySellData.currentPriceETH = dataETH.ask;
    console.log(buySellData)
  } catch (error) {
    console.log(error);
  }
}

//Get current balance in USD. Wil be invoked when we need to buy
const getAvailableBalance = async () => {
  try {
    let account = await authedClient.getAccount()
    return account[0].balance
  } catch (error) {
    console.log(error);
  }
}

//Gets the amount of ether in the account
const getAvailableETH = async () => {
  try {
    let ether = await authedClient.getAccount();
    return ether[1].balance
  } catch (error) {
  console.log(error)
  }
}

//Gets the amount of bitcoin in the account
const getAvailableBTC = async () => {
  try {
    let btc = await authedClient.getAccount();
    return btc[2].balance
  } catch (error) {
    console.log(error);
  }
}

//if price at start = 100, buycondition would be $98.50
const checkBuyCondition = (buySellData) => {
  if (buySellData.currentPriceETH <= buySellData.benchMarkPriceETH)  {
    return true
  }
  return false
}

//If bought at 98.50 sell at 100.47
const checkSellCondition = (buySellData) => {
  if (buySellData.currentPriceETH >= buySellData.boughtPriceETH * 1.025) {
    return true;
  }
  return false;
}

//Ask GDAX for the benchmark price, invoked in intervals below
const getBenchmark = async () => {
  try {
    let data = await authedClient.getProductTicker('ETH-USD')
    buySellData.benchMarkPriceETH = data.ask
  } catch (error) {
    console.log(error);
  }
}

//Sets the amount to buy as a percentage of available, right now 50% of what's available funds,  or it will buy $20
const calculateBuyAmount = async () => {
  try {
    let totalFunds = await getAvailableBalance()
    let buyAmount = totalFunds * 0.50
    if (totalFunds < 30) {
      return false
    } else if (buyAmount > 30) {
      let largerSize = buyAmount / buySellData.currentPriceETH
      buyParams.size = largerSize.toFixed(4)
    } else {
      let size = 30 / buySellData.currentPriceETH;
      buyParams.size = size.toFixed(4)
    }
  } catch (error) {
    console.log(error);
  }
}

const setAsBought = (error, response, data) => {
  if (error) {
    console.log(error);
  } else {
    console.log(response.body);
    buySellData.boughtPriceETH = data.price;
    bought = true
  }
}

const setAsSold = (error, response, data) => {
  if (error) {
    throw error;
  } else {
    // console.log(data);
    let json = response.body;
    let soldData = JSON.parse(json);
    console.log(soldData);
    if(soldData.created_at === "" || !soldData.created_at ){
      return
    } else {
      buySellData.boughtPriceETH = 0;
      bought = false;
    }
  }
}

//Ask GDAX for the current  price, invoked in intervals below
const current = async () => {
  let data = await authedClient.getProductTicker('ETH-USD');
  //each ping to GDAX should resolve these to booleans
  let buy = checkBuyCondition(buySellData);
  let sell = checkSellCondition(buySellData);
  let enoughFunds = await calculateBuyAmount();
  let sellme = await getAvailableETH();
  buySellData.currentPriceETH = data.ask;
  buyParams.price = data.ask;
  sellParams.price = data.ask;
  sellParams.size = sellme;
  console.log(buySellData);
  console.log(buyParams);
  console.log(sellParams);
  console.log(bought);
  console.log(buy);
  console.log(sell);
  // If buy condiutions are met, execute a trade. Only ONE trade should be executed at a time
  if (bought == false) {
    if (buy == true && enoughFunds != false) {
        console.log('buy');
        authedClient.buy(buyParams, setAsBought)
    } else {
      return;
    }
  } else {
    if (sell == true && sellParams.size > 0) {
      authedClient.sell(sellParams, setAsSold);
    }
  }
}
//start
start()
//find a new benchmark every 4 hours
setInterval(getBenchmark, 14400000);
//check the price every minute
setInterval(current, 3000);

module.exports = {
  getAvailableBalance,
  checkBuyCondition,
  calculateBuyAmount
}
