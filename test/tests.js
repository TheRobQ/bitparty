const expect = require('chai').expect
const chaiChanges = require("chai-changes");
const scripts = require('../scripts')
const start = 100;
const current = 95;
const sellOff = 98;
const highBalance = 300;
buyParams{funds: 0};

describe('buyCondition', function(){
  it('should return a number', function(){
    expect(scripts.checkBuyCondition(start)).to.be.a('number');
  });
  it('should see if price drops 5 percent', function(){
    expect(scripts.checkBuyCondition(start)).to.equal(95);
  });
})

describe('calculateBuyAmount', function(){
  it('should use 10% of the account Balance to when executing a buy order',       function(){
    expect(scripts.buyAmount(highBalance)).to.equal(30)
  });
  it('should set buy amount to 20 if buy amount is less than 20', function(){
  expect(scripts.buyAmount(start)).to.equal(20)
  })
})
