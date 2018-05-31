'use strict';
const Gdax = require('gdax');
const publicClient = new Gdax.PublicClient();
const key = 'ffe43a14b45d9306635a3b6d89fe287c';
const secret = '50d84qdGDy3WQyW1em+VhdpK9RqSy7q6i4ihmQSqKRY56E1N201VfoI3nMJsNNzjHrPFk4HoxfwbhPiH45r6KA==';
const passphrase = 'jhi3acc4ox';
const apiURI = 'https://api.gdax.com';
const accountID = '12212be5-f341-4301-9654-b32fbd2e6501';
const authedClient = new Gdax.AuthenticatedClient(
  key,
  secret,
  passphrase,
  apiURI
);
//holds current BTC value, benchmark value
const buySellData = {
  benchMarkPriceBTC: 0,
  benchMarkPriceETH: 0,
  currentPriceBTC: 0,
  currentPriceETH: 0,
  boughtPriceBTC: 0,
  boughtPriceETH: 0,
  bought: false,
}

//kick it off
const start = async () => {
    let data = await authedClient.getProductTicker('BTC-USD');
    let dataETH = await authedClient.getProductTicker('ETH-USD');
    buySellData.benchMarkPriceBTC =  data.ask;
    buySellData.currentPriceBTC =  data.ask;
    buySellData.benchMarkPriceETH =  dataETH.ask;
    buySellData.currentPriceETH =  dataETH.ask
  }
start()

//Get current balance in USD. Wil be invoked when we need to buy
const getAvailableBalance = async () => {
  let account = await authedClient.getAccount()
  return account[0].balance
}

//Gets the amount of ether in the account
const getAvailableETH = async () => {
    let ether = await authedClient.getAccount();
    return ether[1].balance
}

//Gets the amount of bitcoin in the account
const getAvailableBTC = async () => {
    let btc = await authedClient.getAccount();
    return btc[2].balance
}

//Parameters to pass into the buy method
//Needs to have product ID be a variable
const params = {
  side: 'buy',
  type: 'limit',
  time_in_force: 'GTT',
  cancel_after: 'day',
  price: 0,
  size: 0,
  product_id: 'ETH-USD',
};

//Params to pass into sell method
//Needs to have product ID be a variable
const sellParams = {
  price: 0,
  size: 0,
 product_id: 'ETH-USD',
 post_only: true,
}
// authedClient.buy(buyParams);

//if price at start = 100, buycondition would be $95
const checkBuyCondition  = (buySellData) => {
  if(buySellData.currentPriceETH <=buySellData.benchMarkPriceETH * 0.98){
    return true
  } else {
    return false
   }
}

const checkSellCondition = (buySellData) =>{
    if(buySellData.currentPriceETH >= buySellData.boughtPriceETH *  1.02){
      return true;
    }else{
      return false;
    }
}

//Ask GDAX for the benchmark price, invoked in intervals below
const getBenchmark = async () => {
  let data = await authedClient.getProductTicker('ETH-USD')
  buySellData.benchMarkPriceBTC =  data.ask
}

//Sets the amount to buy as a percentage of available funds or $20
 const  calculateBuyAmount = async () =>{
  let totalFunds = await getAvailableBalance()
  let buyAmount = totalFunds * .30
  if(totalFunds < 30){
    return false
  }
  else if(buyAmount > 30){
    let largerSize =  buyAmount / buySellData.currentPriceBTC
    params.size = largerSize.toFixed(4)
  }
  else{
   let size = 30 / buySellData.currentPriceBTC;
   params.size = size.toFixed(4)
  }
}

//Sets the amount to sell
const calculateSellAmount = async() =>{
  let coin = await getAvailableETH();
  sellParams.size = coin
}

//Ask GDAX for the current  price, invoked in intervals below
const current = async () => {
    let data = await authedClient.getProductTicker('ETH-USD');
    //each ping to GDAX should resolve these to booleans
    let buy = checkBuyCondition(buySellData);
    let sell = checkSellCondition(buySellData);
    let enough = calculateBuyAmount();
    calculateSellAmount();
    buySellData.currentPriceBTC =  data.ask;
    params.price = data.ask;
    sellParams.price = data.ask;
    if(buySellData.bought === false && buy === true && enough != false){
      authedClient.placeOrder(params);
      buySellData.boughtPriceETH = buySellData.currentPriceETH;
      buySellData.bought = true;
      buy = false;
    }
    if(buySellData.bought === true && sell === true && buySellData.boughtPriceETH != 0){
      authedClient.sell(sellParams);
      buySellData.boughtPriceETH= 0;
    }
    console.log(buySellData);
    console.log(params);
    console.log(sellParams);
    console.log(buy);
    console.log(sell);
  }

//find a new benchmark every 3 hours
setInterval(getBenchmark, 10800000);
//check the price every minute
setInterval(current, 6000);

module.exports = {
  getAvailableBalance,
  checkBuyCondition,
  calculateBuyAmount
}
