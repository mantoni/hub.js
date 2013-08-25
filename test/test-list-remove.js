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


test('list.remove', {

  before: function () {
    this.list = list();
  },

  'does not iterate removed value': function () {
    this.list.push(1);
    this.list.push(2);
    this.list.push(3);
    var i = this.list.iterator();

    i.next();
    this.list.remove(2);

    assert(i.hasNext());

    assert.equal(i.next(), 3);
    assert.strictEqual(i.hasNext(), false);
  },

  'replaces _tail with _head if last item is removed': function () {
    this.list.push('x');
    this.list.remove('x');

    assert.strictEqual(this.list._tail, this.list._head);
  },

  'replaces _tail with new last item on remove': function () {
    this.list.push('x');
    this.list.push('y');
    this.list.remove('y');

    assert.strictEqual(this.list._tail.value, 'x');
  }

});
