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


function emitsRemoveListener(method, event) {
  return function () {
    var spy       = sinon.spy();
    var listener  = function () {};

    this.hub[method](event, listener);
    this.hub.on('removeListener', spy);
    this.hub.un(event, listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, event, listener);
  };
}


test('events', {

  before: function () {
    this.hub = hub();
  },

  'emits removeListener for on(test)': emitsRemoveListener('on', 'test'),

  'emits removeListener for on(**)': emitsRemoveListener('on', '**'),

  'emits removeListener for once(test)': emitsRemoveListener('once', 'test'),

  'emits removeListener for once(**)': emitsRemoveListener('once', '**'),

  'emits removeListener to matchers': function () {
    var spy = sinon.spy();
    var listener = function () {};

    this.hub.on('*', spy);
    this.hub.on('some.test', listener);
    this.hub.un('some.test', listener);

    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, 'some.test', listener);
  },

  /*
  'does not remove listener if removeListener event was stopped':
    function () {
      this.hub.on('removeListener', function () {
        this.stop();
      });
      var spy = sinon.spy();

      this.hub.on('test', spy);
      this.hub.un('test', spy);
      this.hub.emit('test');

      sinon.assert.calledOnce(spy);
    },

  'does not remove matcher if removeListener event was stopped':
    function () {
      this.hub.on('removeListener', function () {
        this.stop();
      });
      var spy = sinon.spy();

      this.hub.on('test.*', spy);
      this.hub.un('test.*', spy);
      this.hub.emit('test.foo');

      sinon.assert.calledOnce(spy);
    },
  */

  'removes listeners regardless of removeListener emit errors':
    function () {
      this.hub.on('removeListener', function () {
        throw new Error();
      });
      var spy = sinon.spy();

      this.hub.on('test', spy);
      this.hub.un('test', spy);
      this.hub.emit('test');

      sinon.assert.notCalled(spy);
    },

  'does not emit event for removeAllListeners': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllListeners();

    sinon.assert.notCalled(spy);
  },

  'does not emit event for removeAllListeners with event': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllListeners('test');

    sinon.assert.notCalled(spy);
  },

  'does not emit event for removeAllMatching': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllMatching('test');

    sinon.assert.notCalled(spy);
  }

});
