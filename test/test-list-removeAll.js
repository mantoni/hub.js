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


test('list.removeAll', {

  before: function () {
    this.list = list();
  },

  'causes isEmpty to return true': function () {
    this.list.push(42);

    this.list.removeAll();

    assert.strictEqual(this.list.isEmpty(), true);
  },

  'resets hasNext to false for new iterator': function () {
    this.list.push(42);

    this.list.removeAll();

    assert.strictEqual(this.list.iterator().hasNext(), false);
  },

  'resets hasNext to false for existing iterator': function () {
    this.list.push(42);
    var iterator = this.list.iterator();

    this.list.removeAll();

    assert.strictEqual(iterator.hasNext(), false);
  },

  'does not break push': function () {
    this.list.push(1);

    this.list.removeAll();
    this.list.push(2);

    assert.deepEqual(this.list.toArray(), [2]);
  }

});
