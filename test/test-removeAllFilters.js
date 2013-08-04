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
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter(event, spy1);
    this.hub.addFilter(event, spy2);
    spy1.reset(); // this spy was already invoked with a 'newListener' event.

    this.hub.removeAllFilters();
    this.hub.emit('test.run');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  };
}


function testWithEvent(event) {
  return function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    var spy3 = sinon.spy(function (next) { next(); });
    this.hub.addFilter(event, spy1);
    this.hub.addFilter(event, spy2);
    this.hub.addFilter('unrelated', spy3);
    // these spies where already invoked with a 'newListener' event:
    spy1.reset();
    spy2.reset();

    this.hub.removeAllFilters(event);
    this.hub.emit('test.run');
    this.hub.emit('unrelated');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
    sinon.assert.calledOnce(spy3);
  };
}


test('hub.removeAllFilters', {

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
      self.hub.removeAllFilters('test.*');
    });
  },

  'does not remove gneric for more specific': function () {
    var spy = sinon.spy();
    this.hub.addFilter('**.a', spy);

    this.hub.removeAllFilters('test.*');
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener unregistered after emit 1': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test.a', spy);
    hub.emit('test.*');
    spy.reset();

    hub.removeAllFilters('test.a');
    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 2': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test.*', spy);
    hub.emit('test.a');
    spy.reset();

    hub.removeAllFilters('test.*');

    hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 3': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test.*', spy);
    hub.emit('test.a');
    spy.reset();

    hub.removeAllFilters();

    hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 4': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addFilter('test.a', spy);
    hub.emit('test.*');
    spy.reset();

    hub.removeAllFilters();

    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  }

});
