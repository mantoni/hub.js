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

var list   = require('../lib/list');


test('list.toArray', {

  before: function () {
    this.list = list();
  },

  'returns empty array for empty list': function () {
    var a = this.list.toArray();

    assert.deepEqual(a, []);
  },

  'returns pushed values': function () {
    this.list.push(1);
    this.list.push(3);
    this.list.push(7);
    this.list.push(42);

    var a = this.list.toArray();

    assert.deepEqual(a, [1, 3, 7, 42]);
  }

});
