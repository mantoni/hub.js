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


  'should remove on(test.run)' : testWithoutEvent('test.run', 'on'),
  'should remove on(test.*)'   : testWithoutEvent('test.*', 'on'),
  'should remove on(**)'       : testWithoutEvent('**', 'on'),

  'should remove only on(test.run)' : testWithEvent('test.run', 'on'),
  'should remove only on(test.*)'   : testWithEvent('test.*', 'on'),
  'should remove only on(**)'       : testWithEvent('**', 'on'),

  'should not throw if matcher does not exist': function () {
    var self = this;

    assert.doesNotThrow(function () {
      self.hub.removeAllListeners('test.*');
    });
  },

  'should not remove gneric for more specific': function () {
    var spy = sinon.spy();
    this.hub.on('**.a', spy);

    this.hub.removeAllListeners('test.*');
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener unregistered after emit 1': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', spy);
    hub.emit('test.*');
    spy.reset();

    hub.removeAllListeners('test.a');
    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 2': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.*', spy);
    hub.emit('test.a');
    spy.reset();

    hub.removeAllListeners('test.*');

    hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 3': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.*', spy);
    hub.emit('test.a');
    spy.reset();

    hub.removeAllListeners();

    hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 4': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', spy);
    hub.emit('test.*');
    spy.reset();

    hub.removeAllListeners();

    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  }

});
