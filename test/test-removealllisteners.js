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


function testWithoutEvent(event, listenerType) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub[listenerType](event, spy1);
    this.hub[listenerType](event, spy2);
    spy1.reset(); // this spy was already invoked with a 'newListener' event.

    this.hub.removeAllListeners();
    this.hub.emit('test.run');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  };
}


function testWithEvent(event, listenerType) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub[listenerType](event, spy1);
    this.hub[listenerType](event, spy2);
    this.hub[listenerType]('unrelated', spy3);
    // these spies where already invoked with a 'newListener' event:
    spy1.reset();
    spy2.reset();

    this.hub.removeAllListeners(event);
    this.hub.emit('test.run');
    this.hub.emit('unrelated');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
    sinon.assert.calledOnce(spy3);
  };
}


test('hub.removeAllListeners', {

  before: function () {
    this.hub = hub();
  },


  'should remove on(test.run)'      : testWithoutEvent('test.run',  'on'),
  'should remove on(test.*)'        : testWithoutEvent('test.*',    'on'),
  'should remove on(**)'            : testWithoutEvent('**',        'on'),

  'should remove before(test.run)'  : testWithoutEvent('test.run',  'before'),
  'should remove before(test.*)'    : testWithoutEvent('test.*',    'before'),
  'should remove before(**)'        : testWithoutEvent('**',        'before'),

  'should remove after(test.run)'   : testWithoutEvent('test.run',  'after'),
  'should remove after(test.*)'     : testWithoutEvent('test.*',    'after'),
  'should remove after(**)'         : testWithoutEvent('**',        'after'),


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
    var self = this;

    assert.doesNotThrow(function () {
      self.hub.removeAllListeners('test.*');
    });
  },


  'should throw if event is undefined': function () {
    try {
      this.hub.removeAllListeners(undefined);
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected event to be string, but it was undefined');
    }
  },


  'should not remove gneric for more specific': function () {
    var spy = sinon.spy();
    this.hub.on('**.a', spy);

    this.hub.removeAllListeners('test.*');
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  }

});
