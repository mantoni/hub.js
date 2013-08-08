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


test('store.iterator', {

  before: function () {
    this.store = store();
  },

  'has no next item initially': function () {
    var i = this.store.iterator();

    assert(!i.hasNext());
  },

  'has next item after push': function () {
    this.store.push(1);

    var i = this.store.iterator();

    assert(i.hasNext());
  },

  'returns pushed value and set hasNext to false': function () {
    this.store.push(42);
    var i = this.store.iterator();

    var v = i.next();

    assert.equal(v, 42);
    assert.strictEqual(i.hasNext(), false);
  },

  'does not set hasNext to false': function () {
    this.store.push(1);
    this.store.push(2);
    var i = this.store.iterator();

    i.next();

    assert(i.hasNext());
  },

  'returnes each pushed value in push order': function () {
    this.store.push(1);
    this.store.push(2);
    this.store.push(3);
    var i = this.store.iterator();

    assert.equal(i.next(), 1);
    assert.equal(i.next(), 2);
    assert.equal(i.next(), 3);
    assert.strictEqual(i.hasNext(), false);
  },

  'returns object pushed after next': function () {
    var i   = this.store.iterator();
    var spy = sinon.spy();
    this.store.push(1);

    i.next();
    this.store.push(2);

    assert(i.hasNext());

    assert.equal(i.next(), 2);
    assert.strictEqual(i.hasNext(), false);
  },

  'does not iterate value that is removed': function () {
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
