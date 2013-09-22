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

var forest   = require('../lib/forest');


function items(forest, name) {
  var arr = [];
  var i = forest.iterator(name);
  while (i.hasNext()) {
    arr.push(i.next());
  }
  return arr;
}


test('forest', {

  before: function () {
    this.forest = forest();
  },

  'sets first item': function () {
    this.forest.add('test', 42);

    assert.deepEqual(items(this.forest), [42]);
  },

  'replaces item with same name': function () {
    this.forest.add('test', 1);
    this.forest.add('test', 2);

    assert.deepEqual(items(this.forest), [2]);
  },

  'adds item with different name': function () {
    this.forest.add('a', 1);
    this.forest.add('b', 2);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'inserts wildcard item before existing item': function () {
    this.forest.add('a', 2);
    this.forest.add('*', 1);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'inserts item after existing wildcard item': function () {
    this.forest.add('*', 1);
    this.forest.add('a', 2);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'appends equaly ranked items': function () {
    this.forest.add('b.*', 1);
    this.forest.add('a.*', 2);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'inserts a.* before a.b': function () {
    this.forest.add('a.b', 2);
    this.forest.add('a.*', 1);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'inserts a.* before b.c': function () {
    this.forest.add('b.c', 2);
    this.forest.add('a.*', 1);

    assert.deepEqual(items(this.forest), [1, 2]);
  },

  'inserts n.a and n.b as children of n.*': function () {
    this.forest.add('n.*', 1);
    this.forest.add('n.a', 2);
    this.forest.add('n.b', 3);

    assert.deepEqual(items(this.forest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forest, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.forest, 'n.b'), [1, 3]);
  },

  'inserts n.* as parent of n.a and n.b': function () {
    this.forest.add('n.a', 2);
    this.forest.add('n.b', 3);
    this.forest.add('n.*', 1);

    assert.deepEqual(items(this.forest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forest, 'n.a'), [1, 2]);
    assert.deepEqual(items(this.forest, 'n.b'), [1, 3]);
  },

  'finds nodes matching given name': function () {
    this.forest.add('**', 1);
    this.forest.add('a.b.**', 2);
    this.forest.add('a.b.c.d', 3);
    this.forest.add('a.b.c.e', 4);

    assert.deepEqual(items(this.forest, 'a.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.forest, 'a.b.**'), [1, 2, 3, 4]);
    assert.deepEqual(items(this.forest, 'a.b.c.*'), [1, 2, 3, 4]);
  },

  'inserts n.a for n.* and *.a': function () {
    this.forest.add('*.a', 1);
    this.forest.add('n.*', 2);
    this.forest.add('n.a', 3);

    assert.deepEqual(items(this.forest, '*.a'), [1, 2, 3]);
    assert.deepEqual(items(this.forest, 'n.*'), [1, 2, 3]);
    assert.deepEqual(items(this.forest, 'n.a'), [1, 2, 3]);
  },

  'keeps *.a and *.b separated': function () {
    this.forest.add('*.a', 1);
    this.forest.add('*.b', 2);

    assert.deepEqual(items(this.forest, '*.a'), [1]);
    assert.deepEqual(items(this.forest, '*.b'), [2]);
  },

  'does not iterate over items twice': function () {
    this.forest.add('**', 1);
    this.forest.add('*.a', 2);
    this.forest.add('n.*', 3);
    this.forest.add('n.a', 4);

    assert.deepEqual(items(this.forest, '**'), [1, 2, 3, 4]);
  },

  'iterates over siblings in correct order': function () {
    this.forest.add('**', 1);
    this.forest.add('n.*', 3);
    this.forest.add('*.a', 2);

    assert.deepEqual(items(this.forest, '**'), [1, 2, 3]);
  },

  'removes item': function () {
    this.forest.add('a', 1);
    this.forest.add('b', 2);
    this.forest.add('c', 3);

    this.forest.remove('b');

    assert.deepEqual(items(this.forest, '*'), [1, 3]);
  },

  'remove deep child': function () {
    this.forest.add('a.*', 1);
    this.forest.add('a.b', 2);

    this.forest.remove('a.b');

    assert.deepEqual(items(this.forest, '**'), [1]);
  },

  'removes wildcard child': function () {
    this.forest.add('a.*', 1);

    this.forest.remove('a.*');

    assert.deepEqual(items(this.forest, '**'), []);
  },

  'does not remove children': function () {
    this.forest.add('n.*', 1);
    this.forest.add('n.a', 2);
    this.forest.add('n.b', 3);

    this.forest.remove('n.*');

    assert.deepEqual(items(this.forest, '**'), [2, 3]);
  },

  'does not iterate over removed parent': function () {
    this.forest.add('*', 1);
    this.forest.add('a', 2);

    this.forest.remove('*');

    assert.deepEqual(items(this.forest, 'a'), [2]);
  },

  'does not iterate over removed child': function () {
    this.forest.add('*', 1);
    this.forest.add('a', 2);

    this.forest.remove('a');

    assert.deepEqual(items(this.forest, '*'), [1]);
  },

  'removes from sibling': function () {
    this.forest.add('*.a', 1);
    this.forest.add('n.*', 2);
    this.forest.add('n.a', 3);

    this.forest.remove('n.*');

    assert.deepEqual(items(this.forest, '**'), [1, 3]);
    assert.deepEqual(items(this.forest, '*.a'), [1, 3]);
    assert.deepEqual(items(this.forest, 'n.*'), [3]);
    assert.deepEqual(items(this.forest, 'n.a'), [1, 3]);
  },

  'replaces deep child': function () {
    this.forest.add('a.**', 3);
    this.forest.add('a.b.c', 7);
    this.forest.add('a.b.c', 42);

    assert.deepEqual(items(this.forest, '**'), [3, 42]);
  }

});
