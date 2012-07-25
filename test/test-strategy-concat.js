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


test('strategy-concat', {


  'should return entire array': function () {
    var arr   = ['a', 'b', 'c'];
    var value = hub.CONCAT(arr);

    assert.strictEqual(value, arr);
  }


});
