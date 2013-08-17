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


test('store.removeAll', {

  before: function () {
    this.store = store();
  },

  'causes isEmpty to return true': function () {
    this.store.push(42);

    this.store.removeAll();

    assert.strictEqual(this.store.isEmpty(), true);
  },

  'resets hasNext to false for new iterator': function () {
    this.store.push(42);

    this.store.removeAll();

    assert.strictEqual(this.store.iterator().hasNext(), false);
  },

  'resets hasNext to false for existing iterator': function () {
    this.store.push(42);
    var iterator = this.store.iterator();

    this.store.removeAll();

    assert.strictEqual(iterator.hasNext(), false);
  }

});
