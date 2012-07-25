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

var hub       = require('../lib/hub');


test('strategy-last', {


  'should return last value of array': function () {
    var value = hub.LAST(['a', 'b', 'c']);

    assert.equal(value, 'c');
  },


  'should return undefined if array is empty': function () {
    var value = hub.LAST([]);

    assert.equal(typeof value, 'undefined');
  },


  'should not ignore null values': function () {
    var value = hub.LAST(['a', null]);

    assert.strictEqual(value, null);
  }


});
