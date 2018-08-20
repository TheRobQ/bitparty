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
  benchMarkPriceETH: 0,
  currentPriceETH: 0,
  boughtPriceETH: 0,
};
let bought = false;

//kick it off
const start = async () => {
    let dataETH = await authedClient.getProductTicker('ETH-USD');
    buySellData.benchMarkPriceETH =  dataETH.ask;
    buySellData.currentPriceETH =  dataETH.ask;
    console.log(buySellData);
  }

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
const buyParams = {
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
  side: 'sell',
  type: 'limit',
  time_in_force: 'GTT',
  cancel_after: 'day',
  price: 0,
  size: 0,
  product_id: 'ETH-USD',
  // post_only: true,
}

//if price at start = 100, buycondition would be $98.50
const checkBuyCondition  = (buySellData) => {
  if(buySellData.currentPriceETH < buySellData.benchMarkPriceETH * 0.985){
    return true
  }
    return false
}

//If bought at 98.50 sell at 100.47
const checkSellCondition = (buySellData) =>{
    if(buySellData.currentPriceETH >= buySellData.boughtPriceETH *  1.03){
      return true;
    }
      return false;
}

//Ask GDAX for the benchmark price, invoked in intervals below
const getBenchmark = async () => {
  let data = await authedClient.getProductTicker('ETH-USD')
  buySellData.benchMarkPriceETH =  data.ask
}

//Sets the amount to buy as a percentage of available, right now 50% of what's available funds,  or it will buy $20
 const  calculateBuyAmount = async () =>{
  let totalFunds = await getAvailableBalance()
  let buyAmount = totalFunds * 0.50
  if(totalFunds < 30){
    return false
  }
  else if(buyAmount > 30){
    let largerSize =  buyAmount / buySellData.currentPriceETH
    params.size = largerSize.toFixed(4)
  }
  else{
   let size = 30 / buySellData.currentPriceETH;
   params.size = size.toFixed(4)
  }
}

//Sets the amount to sell
const calculateSellAmount = async() =>{
  let coin = await getAvailableETH();
  sellParams.size = coin
}

const setAsBought = (error, resoponse, data) => {
  if(error){
    console.log(error.body);
  }
  else{
    console.log(data.price)
    buySellData.boughtPriceETH = data.price;
    bought = true
  }
}

const setAsSold = (error, resoponse, data) => {
  if(error){
    console.log(error.body);
  }
  else{
    console.log(data.price)
    buySellData.boughtPriceETH = 0;
    bought = false;
  }
}

//Ask GDAX for the current  price, invoked in intervals below
const current = async () => {
    let data = await authedClient.getProductTicker('ETH-USD');
    //each ping to GDAX should resolve these to booleans
    let buy = checkBuyCondition(buySellData);
    let sell = checkSellCondition(buySellData);
    let enoughFunds = await calculateBuyAmount();
    calculateSellAmount();
    buySellData.currentPriceETH =  data.ask;
    params.price = data.ask;
    sellParams.price = data.ask;
    console.log(buySellData);
    console.log(buyParams);
    console.log(sellParams);
    console.log(bought);
    console.log(buy);
    console.log(sell);
    // If buy condiutions are met, execute a trade. Only ONE trade should be executed at a time
    if(bought == false){
        if(buy == true ){
          if(enoughFunds != false){
            authedClient.buy(buyParams, setAsBought)
          }
        }else{
        return;
      }
    }
    else if(bought == true){
        if(sell == true ){
          authedClient.sell(sellParams, setAsSold);
        } else {
          return
        }
    }
  }
//start
start()
//find a new benchmark every 4 hours
setInterval(getBenchmark, 14400000);
//check the price every minute
setInterval(current, 30000);

module.exports = {
  getAvailableBalance,
  checkBuyCondition,
  calculateBuyAmount
}
