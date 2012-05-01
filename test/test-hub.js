var test      = require('utest');
var assert    = require('assert');

var hub       = require('../lib/hub');
var strategy  = require('../lib/strategy');


test('hub.create', {


  'should create instance of Hub': function () {
    assert(hub.create() instanceof hub.Hub);
  }


});


test('hub.LAST', {


  'should be same as strategy.LAST': function () {
    assert.strictEqual(hub.LAST, strategy.LAST);
  }


});


test('hub.CONCAT', {


  'should be same as strategy.CONCAT': function () {
    assert.strictEqual(hub.CONCAT, strategy.CONCAT);
  }


});
