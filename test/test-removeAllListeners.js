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


function testWithoutEvent(event) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.addListener(event, spy1);
    this.hub.addListener(event, spy2);
    spy1.reset(); // this spy was already invoked with a 'newListener' event.

    this.hub.removeAllListeners();
    this.hub.emit('test.run');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  };
}


function testWithEvent(event) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub.addListener(event, spy1);
    this.hub.addListener(event, spy2);
    this.hub.addListener('unrelated', spy3);
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


  'removes on(test.run)' : testWithoutEvent('test.run'),
  'removes on(test.*)'   : testWithoutEvent('test.*'),
  'removes on(**)'       : testWithoutEvent('**'),

  'removes only on(test.run)' : testWithEvent('test.run'),
  'removes only on(test.*)'   : testWithEvent('test.*'),
  'removes only on(**)'       : testWithEvent('**'),

  'does not throw if matcher does not exist': function () {
    var self = this;

    assert.doesNotThrow(function () {
      self.hub.removeAllListeners('test.*');
    });
  },

  'does not remove generic for more specific': function () {
    var spy = sinon.spy();
    this.hub.on('**.a', spy);

    this.hub.removeAllListeners('test.*');
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener unregistered after emit 1': function () {
    var spy = sinon.spy();
    this.hub.on('test.a', spy);
    this.hub.emit('test.*');
    spy.reset();

    this.hub.removeAllListeners('test.a');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 2': function () {
    var spy = sinon.spy();
    this.hub.on('test.*', spy);
    this.hub.emit('test.a');
    spy.reset();

    this.hub.removeAllListeners('test.*');

    this.hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 3': function () {
    var spy = sinon.spy();
    this.hub.on('test.*', spy);
    this.hub.emit('test.a');
    spy.reset();

    this.hub.removeAllListeners();

    this.hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 4': function () {
    var spy = sinon.spy();
    this.hub.on('test.a', spy);
    this.hub.emit('test.*');
    spy.reset();

    this.hub.removeAllListeners();

    this.hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered in filter 1': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test', function (next) {
      hub.removeAllListeners('test');
      next();
    });
    hub.on('test', spy);

    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered in filter 2': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test', function (next) {
      hub.removeAllListeners();
      next();
    });
    hub.on('test', spy);

    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered in listener 1': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test', function () {
      hub.removeAllListeners('test');
    });
    hub.on('test', spy);

    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered in listener 2': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test', function () {
      hub.removeAllListeners();
    });
    hub.on('test', spy);

    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  }

});
