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


test('store.remove', {

  before: function () {
    this.store = store();
  },

  'does not iterate removed value': function () {
    this.store.push(1);
    this.store.push(2);
    this.store.push(3);
    var i = this.store.iterator();

    i.next();
    this.store.remove(2);

    assert(i.hasNext());

    assert.equal(i.next(), 3);
    assert.strictEqual(i.hasNext(), false);
  },

  'replaces _tail with _head if last item is removed': function () {
    this.store.push('x');
    this.store.remove('x');

    assert.strictEqual(this.store._tail, this.store._head);
  },

  'replaces _tail with new last item on remove': function () {
    this.store.push('x');
    this.store.push('y');
    this.store.remove('y');

    assert.strictEqual(this.store._tail.value, 'x');
  }

});
