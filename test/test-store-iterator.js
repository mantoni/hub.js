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
  }

});
