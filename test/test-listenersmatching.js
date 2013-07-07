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

var hub    = require('../lib/hub');


test('hub.listenersMatching', {

  before: function () {
    this.hub = hub();
  },

  'returns exact match': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('test.1', listener1);
    this.hub.on('test.2', listener2);

    var result = this.hub.listenersMatching('test.1');

    assert.deepEqual(result, [listener1]);
  },

  'returns exact wildcard match': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('test.*', listener1);
    this.hub.on('test.x.y', listener2);

    var result = this.hub.listenersMatching('test.*');

    assert.deepEqual(result, [listener1]);
  },

  'returns single wildcard match': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('test.1', listener1);
    this.hub.on('test.2', listener2);

    var result = this.hub.listenersMatching('*.1');

    assert.deepEqual(result, [listener1]);
  },

  'returns double wildcard match': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('test.1.a', listener1);
    this.hub.on('test.2.b', listener2);

    var result = this.hub.listenersMatching('**.a');

    assert.deepEqual(result, [listener1]);
  },

  'returns single wildcard event': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('test.a.*', listener1);
    this.hub.on('test.b.*', listener2);

    var result = this.hub.listenersMatching('*.a.*');

    assert.deepEqual(result, [listener1]);
  },

  'returns double wildcard event': function () {
    var listener1 = function () {};
    var listener2 = function () {};
    this.hub.on('**.a.test.foo', listener1);
    this.hub.on('**.b.test.foo', listener2);

    var result = this.hub.listenersMatching('**.a.**');

    assert.deepEqual(result, [listener1]);
  },

  'returns generic for more specific': function () {
    var listener = function () {};
    this.hub.on('**.a', listener);

    var result = this.hub.listenersMatching('test.a');

    assert.deepEqual(result, [listener]);
  }

});
