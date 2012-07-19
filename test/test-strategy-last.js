/*jslint plusplus: true, vars: true, node: true, indent: 2, maxlen: 78 */
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


  'should not ignore null values': function () {
    var value = strategy.LAST(['a', null]);

    assert.strictEqual(value, null);
  }


});
