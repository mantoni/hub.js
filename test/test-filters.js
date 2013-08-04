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


function testWithEvent(event) {
  return function () {
    var filter1 = function a(next) { next(); };
    var filter2 = function b(next) { next(); };
    var filter3 = function c(next) { next(); };
    this.hub.addFilter(event, filter1);
    this.hub.addFilter(event, filter2);
    this.hub.addFilter('unrelated', filter3);

    var filters = this.hub.filters(event);

    assert.deepEqual(filters, [filter1, filter2]);
  };
}


test('hub.filters', {

  before: function () {
    this.hub = hub();
  },

  'returns only filter(test.run)' : testWithEvent('test.run'),
  'returns only filter(test.*)'   : testWithEvent('test.*'),
  'returns only filter(**)'       : testWithEvent('**'),

  'returns empty array if no filters exist': function () {
    assert.deepEqual(this.hub.filters('test'), []);
  },

  'returns empty array if no matchers exist': function () {
    assert.deepEqual(this.hub.filters('*'), []);
  }

});
