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
    var listener1 = function a() {};
    var listener2 = function b() {};
    var listener3 = function c() {};
    this.hub.addListener(event, listener1);
    this.hub.addListener(event, listener2);
    this.hub.addListener('unrelated', listener3);

    var listeners = this.hub.listeners(event);

    assert.deepEqual(listeners, [listener1, listener2]);
  };
}


test('hub.listeners', {

  before: function () {
    this.hub = hub();
  },

  'returns only on(test.run)' : testWithEvent('test.run'),
  'returns only on(test.*)'   : testWithEvent('test.*'),
  'returns only on(**)'       : testWithEvent('**'),

  'returns empty array if no listeners exist': function () {
    assert.deepEqual(this.hub.listeners('test'), []);
  },

  'returns empty array if no matchers exist': function () {
    assert.deepEqual(this.hub.listeners('*'), []);
  }

});
