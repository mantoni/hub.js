/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');

var strategy  = require('../lib/strategy');


test('strategy-last', {


  'should return last value of array': function () {
    var value = strategy.LAST(['a', 'b', 'c']);

    assert.equal(value, 'c');
  },


  'should return undefined if array is empty': function () {
    var value = strategy.LAST([]);

    assert.equal(typeof value, 'undefined');
  },


  'should ignore undefined values': function () {
    var value = strategy.LAST(['a', undefined, 'b', undefined]);

    assert.equal(value, 'b');
  },


  'should not ignore null values': function () {
    var value = strategy.LAST(['a', null]);

    assert.strictEqual(value, null);
  }


});
