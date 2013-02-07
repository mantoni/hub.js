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


test('events', {

  before: function () {
    this.hub = hub();
  },


  'should emit newListener for on(test)': emitsNewListener('on', 'test'),

  'should emit newListener for on(**)': emitsNewListener('on', '**'),

  'should emit newListener for before(test)': emitsNewListener('before',
    'test'),

  'should emit newListener for before(**)': emitsNewListener('before', '**'),

  'should emit newListener for after(test)': emitsNewListener('after',
    'test'),

  'should emit newListener for after(**)': emitsNewListener('after', '**'),

  'should emit newListener for once(test)': emitsNewListener('once', 'test'),

  'should emit newListener for once(**)': emitsNewListener('once', '**'),


  'should emit newListener to matchers': function () {
    var spy = sinon.spy();
    var listener  = function () {};

    this.hub.on('*', spy);
    this.hub.on('some.test', listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'some.test', listener);
  },


  'should not add listener if newListener event was stopped': function () {
    this.hub.on('newListener', function () {
      this.stop();
    });
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should not add matcher if newListener event was stopped': function () {
    this.hub.on('newListener', function () {
      this.stop();
    });
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should add listeners regardless of newListener emit errors': function () {
    this.hub.on('newListener', function () {
      throw new Error();
    });
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  }

});
