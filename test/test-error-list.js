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

var ErrorList = require('../lib/error-list');


test('error-list', {


  'should be error': function () {
    var error = new ErrorList([]);

    assert(error instanceof Error);
  },


  'should be named ErrorList': function () {
    var error = new ErrorList([]);

    assert.equal(error.name, 'ErrorList');
  },


  'should expose given errors': function () {
    var errors  = [new TypeError(), new RangeError()];

    var error   = new ErrorList(errors);

    assert.strictEqual(error.errors, errors);
  }


});