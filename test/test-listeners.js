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

  'should remove only on(test.run)'     : testWithEvent('test.run', 'on'),
  'should remove only on(test.*)'       : testWithEvent('test.*',   'on'),
  'should remove only on(**)'           : testWithEvent('**',       'on'),

  'should remove only before(test.run)' : testWithEvent('test.run', 'before'),
  'should remove only before(test.*)'   : testWithEvent('test.*',   'before'),
  'should remove only before(**)'       : testWithEvent('**',       'before'),

  'should remove only after(test.run)'  : testWithEvent('test.run', 'after'),
  'should remove only after(test.*)'    : testWithEvent('test.*',   'after'),
  'should remove only after(**)'        : testWithEvent('**',       'after'),


  'should not throw if matcher does not exist': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.listeners('test.*');
    });
  },


  'should throw if event is not given': function () {
    try {
      this.hub.listeners();
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected event to be string, but it was undefined');
    }
  },


  'should throw if event is null': function () {
    try {
      this.hub.listeners(null);
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected event to be string, but it was null');
    }
  }

});
