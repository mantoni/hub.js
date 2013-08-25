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


test('list.iterator', {

  before: function () {
    this.list = list();
  },

  'has no next item initially': function () {
    var i = this.list.iterator();

    assert(!i.hasNext());
  },

  'has next item after push': function () {
    this.list.push(1);

    var i = this.list.iterator();

    assert(i.hasNext());
  },

  'returns pushed value and set hasNext to false': function () {
    this.list.push(42);
    var i = this.list.iterator();

    var v = i.next();

    assert.equal(v, 42);
    assert.strictEqual(i.hasNext(), false);
  },

  'does not set hasNext to false': function () {
    this.list.push(1);
    this.list.push(2);
    var i = this.list.iterator();

    i.next();

    assert(i.hasNext());
  },

  'returnes each pushed value in push order': function () {
    this.list.push(1);
    this.list.push(2);
    this.list.push(3);
    var i = this.list.iterator();

    assert.equal(i.next(), 1);
    assert.equal(i.next(), 2);
    assert.equal(i.next(), 3);
    assert.strictEqual(i.hasNext(), false);
  },

  'returns object pushed after next': function () {
    var i   = this.list.iterator();
    var spy = sinon.spy();
    this.list.push(1);

    i.next();
    this.list.push(2);

    assert(i.hasNext());

    assert.equal(i.next(), 2);
    assert.strictEqual(i.hasNext(), false);
  },

  'throws if next as never called': function () {
    this.list.push(1);
    var i = this.list.iterator();

    assert.throws(function () {
      i.insert(0);
    });
  },

  'inserts before first item': function () {
    this.list.push(1);
    var i = this.list.iterator();

    i.next();
    i.insert(0);

    assert.deepEqual(this.list.toArray(), [0, 1]);
    assert.strictEqual(i.hasNext(), false);
  },

  'insert does not confuse push': function () {
    this.list.push(1);
    var i = this.list.iterator();

    i.next();
    i.insert(0);
    this.list.push(2);

    assert.deepEqual(this.list.toArray(), [0, 1, 2]);
  },

  'inserts before existing item': function () {
    this.list.push(2);
    var i = this.list.iterator();

    i.next();
    i.insert(1);

    assert.deepEqual(this.list.toArray(), [1, 2]);
  },

  'removes the only item': function () {
    this.list.push(1);
    var i = this.list.iterator();

    i.next();
    i.remove();

    assert.deepEqual(this.list.toArray(), []);
    assert(this.list.isEmpty());
    assert.strictEqual(i.hasNext(), false);
  },

  'remove does not break push': function () {
    this.list.push(1);
    var i = this.list.iterator();

    i.next();
    i.remove();
    this.list.push(2);

    assert.deepEqual(this.list.toArray(), [2]);
    assert.strictEqual(this.list.isEmpty(), false);
  },

  'remove does not break insert': function () {
    this.list.push(0);
    this.list.push(2);
    var i = this.list.iterator();

    i.next();
    i.remove();
    i.next();
    i.insert(1);

    assert.deepEqual(this.list.toArray(), [1, 2]);
    assert.strictEqual(this.list.isEmpty(), false);
    assert.strictEqual(i.hasNext(), false);
  },

  'remove can be performed twice': function () {
    this.list.push(1);
    this.list.push(2);
    var i = this.list.iterator();

    i.next();
    i.remove();

    assert(i.hasNext());

    i.next();
    i.remove();

    assert.strictEqual(i.hasNext(), false);
    assert.deepEqual(this.list.toArray(), []);
    assert.strictEqual(this.list.isEmpty(), true);
  },

  'removes item before other item': function () {
    this.list.push(1);
    this.list.push(2);
    var i = this.list.iterator();

    i.next();
    i.remove();

    assert(i.hasNext());
    assert.strictEqual(this.list.isEmpty(), false);
    assert.deepEqual(this.list.toArray(), [2]);
  },

  'removes item between other items': function () {
    this.list.push(1);
    this.list.push(2);
    this.list.push(3);
    var i = this.list.iterator();

    i.next();
    i.next();
    i.remove();

    assert(i.hasNext());
    assert.strictEqual(this.list.isEmpty(), false);
    assert.deepEqual(this.list.toArray(), [1, 3]);
  }

});
