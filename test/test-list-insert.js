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


test('list.insert', {

  before: function () {
    this.list = list();
  },

  'inserted value before existing item': function () {
    this.list.push(2);
    var i = this.list.iterator();

    this.list.insert(1, 2);

    assert.deepEqual(this.list.toArray(), [1, 2]);
  }

});
