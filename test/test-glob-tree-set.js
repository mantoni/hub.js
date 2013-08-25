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

var tree   = require('../lib/glob-tree');


function items(tree, name) {
  var arr = [];
  var i = tree.iterator(name);
  while (i.hasNext()) {
    arr.push(i.next());
  }
  return arr;
}


test('glob-tree.set', {

  before: function () {
    this.tree = tree();
  },

  'sets first item': function () {
    this.tree.set('test', 42);

    assert.deepEqual(items(this.tree), [42]);
  },

  'replaces item with same name': function () {
    this.tree.set('test', 1);
    this.tree.set('test', 2);

    assert.deepEqual(items(this.tree), [2]);
  },

  'adds item with different name': function () {
    this.tree.set('a', 1);
    this.tree.set('b', 2);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'inserts wildcard item before existing item': function () {
    this.tree.set('a', 2);
    this.tree.set('*', 1);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'inserts item after existing wildcard item': function () {
    this.tree.set('*', 1);
    this.tree.set('a', 2);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'appends equaly ranked items': function () {
    this.tree.set('b.*', 1);
    this.tree.set('a.*', 2);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'inserts a.* before a.b': function () {
    this.tree.set('a.b', 2);
    this.tree.set('a.*', 1);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'inserts a.* before b.c': function () {
    this.tree.set('b.c', 2);
    this.tree.set('a.*', 1);

    assert.deepEqual(items(this.tree), [1, 2]);
  },

  'inserts n.a and n.b as children of n.*': function () {
    this.tree.set('n.*', 1);
    this.tree.set('n.a', 2);
    this.tree.set('n.b', 3);

    assert.deepEqual(items(this.tree, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.tree, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.tree, 'n.b'), [1, 3]);
  },

  'inserts n.* as parent of n.a and n.b': function () {
    this.tree.set('n.a', 2);
    this.tree.set('n.b', 3);
    this.tree.set('n.*', 1);

    assert.deepEqual(items(this.tree, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.tree, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.tree, 'n.b'), [1, 3]);
  },

  'finds nodes matching given name': function () {
    this.tree.set('**', 1);
    this.tree.set('a.b.**', 2);
    this.tree.set('a.b.c.d', 3);
    this.tree.set('a.b.c.e', 4);

    assert.deepEqual(items(this.tree, 'a.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.tree, 'a.b.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.tree, 'a.b.c.*'), [1, 2, 3, 4]);
  }

});
