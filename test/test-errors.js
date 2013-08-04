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


test('errors emitted', {

  before: function () {
    this.hub = hub();
    var err = this.err = new Error('oups');
    this.hub.on('test.ouch', function () { throw err; });
  },

  'default error event with cause': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('error', spy1);
    this.hub.on('error', spy2);

    this.hub.emit('test.ouch');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledWith(spy1, this.err);
    sinon.assert.calledWith(spy2, this.err);
  },

  'invokes second error handler if first throws and then errs': function () {
    var errorSpy   = sinon.spy();
    var errorError = new Error('uh oh');
    this.hub.on('error', function () {
      throw errorError;
    });
    this.hub.on('error', errorSpy);

    try {
      this.hub.emit('test.ouch');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'Error');
      assert.equal(e.message, 'uh oh');
    }

    sinon.assert.calledOnce(errorSpy);
    sinon.assert.calledWith(errorSpy, this.err);
  },

  'does not invoke * matcher twice': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { throw new Error('ouch'); });
    this.hub.on('*', spy);

    this.hub.emit('test', function () {});

    sinon.assert.calledOnce(spy); // and not twice!
  },

  'sets this.event to "error"': function () {
    var spy = sinon.spy();
    this.hub.on('error', spy);

    this.hub.emit('test.ouch');

    sinon.assert.calledOn(spy, sinon.match.has('event', 'error'));
  },

  'sets this.args to [err]': function () {
    var spy = sinon.spy();
    this.hub.on('error', spy);

    this.hub.emit('test.ouch', 42, 'abc');

    sinon.assert.calledOn(spy, sinon.match.has('args', [sinon.match({
      name    : 'Error',
      message : 'oups'
    })]));
  },

  'sets this.cause to original scope': function () {
    var onEvent = sinon.spy(function (next) { next(); });
    var onError = sinon.spy();
    this.hub.addFilter('test.ouch', onEvent);
    this.hub.on('error', onError);

    this.hub.emit('test.ouch');

    sinon.assert.calledOn(onError,
        sinon.match.has('cause', onEvent.firstCall.thisValue));
  },

  'invokes filter': function () {
    var spy = sinon.spy();
    this.hub.addFilter('error', spy);

    this.hub.emit('test.ouch');

    sinon.assert.calledOnce(spy);
  },

  'invokes filter with same scope as listener': function () {
    var filter   = sinon.spy(function (next) { next(); });
    var listener = sinon.spy();
    this.hub.addFilter('error', filter);
    this.hub.addListener('error', listener);

    this.hub.emit('test.ouch');

    assert.strictEqual(filter.firstCall.thisValue,
        listener.firstCall.thisValue);
  },

  'passes listener result back to filter callback': function () {
    var spy = sinon.spy();
    this.hub.addFilter('error', function (next) { next(spy); });
    this.hub.addListener('error', function () { return 42; });

    this.hub.emit('test.ouch');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, [42]);
  }

});
