/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var hub     = require('../lib/hub');


function testWithEvent(event, listenerType) {
  return function () {
    var listener1 = function a() {};
    var listener2 = function b() {};
    var listener3 = function c() {};
    this.hub[listenerType](event, listener1);
    this.hub[listenerType](event, listener2);
    this.hub[listenerType]('unrelated', listener3);

    var listeners = this.hub.listeners(event);

    assert.deepEqual(listeners, [listener1, listener2]);
  };
}


test('hub.listeners', {

  before: function () {
    this.hub = hub();
  },

  'should return only on(test.run)'     : testWithEvent('test.run', 'on'),
  'should return only on(test.*)'       : testWithEvent('test.*',   'on'),
  'should return only on(**)'           : testWithEvent('**',       'on'),

  'should return only before(test.run)' : testWithEvent('test.run', 'before'),
  'should return only before(test.*)'   : testWithEvent('test.*',   'before'),
  'should return only before(**)'       : testWithEvent('**',       'before'),

  'should return only after(test.run)'  : testWithEvent('test.run', 'after'),
  'should return only after(test.*)'    : testWithEvent('test.*',   'after'),
  'should return only after(**)'        : testWithEvent('**',       'after'),


  'should not throw if listener does not exist': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.listeners('test');
    });
  },


  'should not throw if matcher does not exist': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.listeners('test.*');
    });
  }

});
