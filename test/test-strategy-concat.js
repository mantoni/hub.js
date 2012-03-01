var test      = require('utest');
var assert    = require('assert');

var strategy  = require('../lib/strategy');


test('strategy-concat', {


  'should return entire array': function () {
    var arr   = ['a', 'b', 'c'];
    var value = strategy.CONCAT(arr);
    
    assert.strictEqual(value, arr);
  }


});
