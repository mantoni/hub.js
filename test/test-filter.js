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


test('hub.filter', {

  before: function () {
    this.hub = hub();
  },

  'invokes filters for event': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'invokes filter for broadcast event': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener if next is not called': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', function (next) {});
    this.hub.addListener('test', spy);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy);
  },

  'invokes listener if next is called': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', function (next) { next(function () {}); });
    this.hub.addListener('test', spy);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'exposes hub and args in scope 1': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', spy);
    this.hub.emit('test', 123, 'abc');

    assert.strictEqual(spy.firstCall.thisValue.hub, this.hub);
    assert.deepEqual(spy.firstCall.thisValue.args, [123, 'abc']);
  },

  'exposes hub and args in scope 2': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', function (next) { next(function () {}); });
    this.hub.addFilter('test', spy);
    this.hub.emit('test', 123, 'abc');

    assert.strictEqual(spy.firstCall.thisValue.hub, this.hub);
    assert.deepEqual(spy.firstCall.thisValue.args, [123, 'abc']);
  },

  'invokes multiple filters in a chain': function () {
    var filter1 = sinon.stub();
    var filter2 = sinon.spy();

    this.hub.addFilter('test', filter1);
    this.hub.addFilter('test', filter2);
    this.hub.emit('test');

    sinon.assert.calledOnce(filter1);
    sinon.assert.notCalled(filter2);

    filter1.callArg(0, function () {});

    sinon.assert.calledOnce(filter2);
  },

  'does not invoke callback by default': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', function (next) { next(function () {}); });
    this.hub.emit('test', spy);

    sinon.assert.notCalled(spy);
  },

  'invokes callback if filter invokes callback': function () {
    var spy = sinon.spy();

    this.hub.addFilter('test', function (next, callback) { callback(); });
    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
  },

  'builds a callback chain': function () {
    var filter1 = sinon.stub().callsArgWith(0, function () {});
    var filter2 = sinon.stub().callsArg(1);
    var spy = sinon.spy();

    this.hub.addFilter('test', filter1);
    this.hub.addFilter('test', filter2);
    this.hub.emit('test', spy);

    sinon.assert.notCalled(spy);

    filter1.callArg(1);

    sinon.assert.calledOnce(spy);
  },

  'passes callback args to function passed to next': function () {
    var spy = sinon.spy();
    this.hub.addFilter('test', function (next) { next(spy); });
    this.hub.addFilter('test', function (next, cb) { cb(null, 42); });

    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 42);
  },

  'throws if next is not invoked with callback': function () {
    var h = this.hub;
    h.addFilter('test', function (next) { next(); });

    assert.throws(function () {
      h.emit('test');
    }, /TypeError: No callback passed to next/);
  },

  'invokes callback with error if next is not invoked with callback':
    function () {
      this.hub.addFilter('test', function (next) { next(); });
      var spy = sinon.spy();

      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithMatch(spy, {
        name    : 'TypeError',
        message : 'No callback passed to next'
      });
    },

  'returns undefined if callback is invoked without args': function () {
    this.hub.addFilter('test', function (next, callback) {
      callback();
    });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, undefined);
  },

  'returns empty array if callback is invoked without args': function () {
    this.hub.addFilter('test', function (next, callback) {
      callback();
    });
    var spy = sinon.spy();

    this.hub.emit({ event : 'test', allResults : true }, spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, []);
  }

});
