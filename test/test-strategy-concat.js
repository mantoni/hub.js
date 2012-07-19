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


test('strategy-concat', {


  'should return entire array': function () {
    var arr   = ['a', 'b', 'c'];
    var value = strategy.CONCAT(arr);

    assert.strictEqual(value, arr);
  }


});
