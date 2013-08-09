/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var store  = require('../lib/store');


test('store.toArray', {

  before: function () {
    this.store = store();
  },

  'returns empty array for empty store': function () {
    var a = this.store.toArray();

    assert.deepEqual(a, []);
  },

  'returns pushed values': function () {
    this.store.push(1);
    this.store.push(3);
    this.store.push(7);
    this.store.push(42);

    var a = this.store.toArray();

    assert.deepEqual(a, [1, 3, 7, 42]);
  }

});
