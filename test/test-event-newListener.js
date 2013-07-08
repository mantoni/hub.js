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


function emitsNewListener(method, event) {
  return function () {
    var spy      = sinon.spy();
    var listener = function () {};

    this.hub.on('newListener', spy);
    this.hub[method](event, listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, event, sinon.match.func);
  };
}


test('event.newListener', {

  before: function () {
    this.hub = hub();
  },

  'emits for on(test)': emitsNewListener('on', 'test'),

  'emits for on(**)': emitsNewListener('on', '**'),

  'emits for once(test)': emitsNewListener('once', 'test'),

  'emits for once(**)': emitsNewListener('once', '**'),

  'emits to matchers': function () {
    var spy = sinon.spy();
    var listener  = function () {};

    this.hub.on('*', spy);
    this.hub.on('some.test', listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'some.test', listener);
  },

  /*
  'does not add listener if stopped': function () {
    this.hub.on('newListener', function () {
      this.stop();
    });
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not add matcher if stopped': function () {
    this.hub.on('newListener', function () {
      this.stop();
    });
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },
  */

  'adds listeners regardless of errors': function () {
    this.hub.on('newListener', function () {
      throw new Error();
    });
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  }

});
