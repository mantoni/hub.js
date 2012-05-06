var test      = require('utest');
var assert    = require('assert');

var hub       = require('../lib/hub');
var ErrorList = require('../lib/error-list');
var strategy  = require('../lib/strategy');


test('hub', {


  'should create instance of Hub': function () {
    assert(hub() instanceof hub.Hub);
  },


  "should expose ErrorList": function () {
    assert.strictEqual(hub.ErrorList, ErrorList);
  },


  "should expose strategy.LAST": function () {
    assert.strictEqual(hub.LAST, strategy.LAST);
  },


  "should expose strategy.CONCAT": function () {
    assert.strictEqual(hub.CONCAT, strategy.CONCAT);
  }


});
