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

var forrest   = require('../lib/forrest');


function items(forrest, name) {
  var arr = [];
  var i = forrest.iterator(name);
  while (i.hasNext()) {
    arr.push(i.next());
  }
  return arr;
}


test('forrest', {

  before: function () {
    this.forrest = forrest();
  },

  'sets first item': function () {
    this.forrest.set('test', 42);

    assert.deepEqual(items(this.forrest), [42]);
  },

  'replaces item with same name': function () {
    this.forrest.set('test', 1);
    this.forrest.set('test', 2);

    assert.deepEqual(items(this.forrest), [2]);
  },

  'adds item with different name': function () {
    this.forrest.set('a', 1);
    this.forrest.set('b', 2);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'inserts wildcard item before existing item': function () {
    this.forrest.set('a', 2);
    this.forrest.set('*', 1);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'inserts item after existing wildcard item': function () {
    this.forrest.set('*', 1);
    this.forrest.set('a', 2);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'appends equaly ranked items': function () {
    this.forrest.set('b.*', 1);
    this.forrest.set('a.*', 2);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'inserts a.* before a.b': function () {
    this.forrest.set('a.b', 2);
    this.forrest.set('a.*', 1);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'inserts a.* before b.c': function () {
    this.forrest.set('b.c', 2);
    this.forrest.set('a.*', 1);

    assert.deepEqual(items(this.forrest), [1, 2]);
  },

  'inserts n.a and n.b as children of n.*': function () {
    this.forrest.set('n.*', 1);
    this.forrest.set('n.a', 2);
    this.forrest.set('n.b', 3);

    assert.deepEqual(items(this.forrest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forrest, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.forrest, 'n.b'), [1, 3]);
  },

  'inserts n.* as parent of n.a and n.b': function () {
    this.forrest.set('n.a', 2);
    this.forrest.set('n.b', 3);
    this.forrest.set('n.*', 1);

    assert.deepEqual(items(this.forrest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forrest, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.forrest, 'n.b'), [1, 3]);
  },

  'finds nodes matching given name': function () {
    this.forrest.set('**', 1);
    this.forrest.set('a.b.**', 2);
    this.forrest.set('a.b.c.d', 3);
    this.forrest.set('a.b.c.e', 4);

    assert.deepEqual(items(this.forrest, 'a.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.forrest, 'a.b.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.forrest, 'a.b.c.*'), [1, 2, 3, 4]);
  },

  'inserts n.a for n.* and *.a': function () {
    this.forrest.set('*.a', 1);
    this.forrest.set('n.*', 2);
    this.forrest.set('n.a', 3);

    assert.deepEqual(items(this.forrest, '*.a'), [1, 2, 3]);
    assert.deepEqual(items(this.forrest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forrest, 'n.a'), [1, 2, 3]);
  },

  'keeps *.a and *.b separated': function () {
    this.forrest.set('*.a', 1);
    this.forrest.set('*.b', 2);

    assert.deepEqual(items(this.forrest, '*.a'), [1]);
    assert.deepEqual(items(this.forrest, '*.b'), [2]);
  }

});
