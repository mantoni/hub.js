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


test('hub.filtersMatching', {

  before: function () {
    this.hub = hub();
  },

  'returns exact match': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('test.1', filter1);
    this.hub.addFilter('test.2', filter2);

    var result = this.hub.filtersMatching('test.1');

    assert.deepEqual(result, [filter1]);
  },

  'returns exact wildcard match': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('test.*', filter1);
    this.hub.addFilter('test.x.y', filter2);

    var result = this.hub.filtersMatching('test.*');

    assert.deepEqual(result, [filter1]);
  },

  'returns single wildcard match': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('test.1', filter1);
    this.hub.addFilter('test.2', filter2);

    var result = this.hub.filtersMatching('*.1');

    assert.deepEqual(result, [filter1]);
  },

  'returns double wildcard match': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('test.1.a', filter1);
    this.hub.addFilter('test.2.b', filter2);

    var result = this.hub.filtersMatching('**.a');

    assert.deepEqual(result, [filter1]);
  },

  'returns single wildcard event': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('test.a.*', filter1);
    this.hub.addFilter('test.b.*', filter2);

    var result = this.hub.filtersMatching('*.a.*');

    assert.deepEqual(result, [filter1]);
  },

  'returns double wildcard event': function () {
    var filter1 = function (next) { next(); };
    var filter2 = function (next) { next(); };
    this.hub.addFilter('**.a.test.foo', filter1);
    this.hub.addFilter('**.b.test.foo', filter2);

    var result = this.hub.filtersMatching('**.a.**');

    assert.deepEqual(result, [filter1]);
  },

  'returns generic for more specific': function () {
    var filter = function (next) { next(); };
    this.hub.addFilter('**.a', filter);

    var result = this.hub.filtersMatching('test.a');

    assert.deepEqual(result, [filter]);
  }

});
