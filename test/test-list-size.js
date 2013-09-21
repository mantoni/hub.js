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


test('list.size', {

  before: function () {
    this.list = list();
  },

  'returns 0 for empty list': function () {
    assert.strictEqual(this.list.size(), 0);
  },

  'returns number of pushed values': function () {
    this.list.push(2);
    this.list.push(3);
    this.list.push(7);
    this.list.push(42);

    assert.strictEqual(this.list.size(), 4);
  }

});
