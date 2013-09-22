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


test('list.length', {

  before: function () {
    this.list = list();
  },

  'is initialized with zero': function () {
    assert.strictEqual(this.list.length, 0);
  },

  'reflects number of pushed items': function () {
    this.list.push(2);
    this.list.push(3);
    this.list.push(7);
    this.list.push(42);

    assert.strictEqual(this.list.length, 4);
  },

  'is incremented by insert': function () {
    this.list.push(42);

    this.list.insert(7, 42);

    assert.strictEqual(this.list.length, 2);
  },

  'is incremented by iterator.insert': function () {
    this.list.push(42);
    var i = this.list.iterator();
    i.next();

    i.insert(7);

    assert.strictEqual(this.list.length, 2);
  },

  'is decremented by remove': function () {
    this.list.push(2);
    this.list.push(3);
    this.list.push(7);

    this.list.remove(3);

    assert.strictEqual(this.list.length, 2);
  },

  'is decremented by iterator.remove': function () {
    this.list.push(2);
    this.list.push(3);
    this.list.push(7);
    var i = this.list.iterator();
    i.next();
    i.next();

    i.remove();

    assert.strictEqual(this.list.length, 2);
  },

  'is reset to zero by removeAll': function () {
    this.list.push(2);
    this.list.push(3);
    this.list.push(7);

    this.list.removeAll();

    assert.strictEqual(this.list.length, 0);
  }

});
