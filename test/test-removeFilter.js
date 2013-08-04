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


function noop(next, callback) {
  next(callback);
}


test('hub.removeFilter', {

  before: function () {
    this.hub = hub();
  },

  'does not emit to filter after remove': function () {
    var spy = sinon.spy();
    this.hub.addFilter('test', spy);

    this.hub.removeFilter('test', spy);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy);
  },

  'invokes a filter that was added previously': function () {
    var spy = sinon.spy(noop);
    this.hub.addFilter('test', spy);
    this.hub.addFilter('test', noop);

    this.hub.removeFilter('test', noop);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'invokes a filter that was added afterwards': function () {
    var spy = sinon.spy(noop);
    this.hub.addFilter('test', spy);
    this.hub.addFilter('test', noop);

    this.hub.removeFilter('test', noop);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'does not invoke filter unregistered after emit': function () {
    var spy = sinon.spy(noop);
    this.hub.addFilter('test.a', spy);
    this.hub.addFilter('test.b', noop);
    this.hub.emit('test.*');
    spy.reset();

    this.hub.removeFilter('test.a', spy);
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke filter unregistered after broadcast': function () {
    var spy = sinon.spy(noop);
    this.hub.addFilter('a.*', spy);
    this.hub.addFilter('b.*', noop);
    this.hub.emit('*.*');
    spy.reset();

    this.hub.removeFilter('a.*', spy);
    this.hub.emit('*.*');

    sinon.assert.notCalled(spy);
  },

  'removes once filter': function () {
    var spy = sinon.spy();
    this.hub.filterOnce('test', spy);

    this.hub.removeFilter('test', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  }

});


function emitsRemoveFilter(method, event) {
  return function () {
    var spy    = sinon.spy(function (next, callback) { next(callback); });
    var filter = function (next, callback) { next(callback); };

    this.hub[method](event, filter);
    this.hub.on('removeFilter', spy);
    this.hub.removeFilter(event, filter);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, event, filter);
  };
}

test('event.removeFilter', {

  before: function () {
    this.hub = hub();
  },

  'emits for addFilter(test)': emitsRemoveFilter('addFilter', 'test'),

  'emits for addFilter(**)': emitsRemoveFilter('addFilter', '**'),

  //'emits for once(test)': emitsRemoveFilter('once', 'test'),

  //'emits for once(**)': emitsRemoveFilter('once', '**'),

  'does not remove listener if filtered': function () {
    this.hub.addFilter('removeFilter', function () {});
    var spy = sinon.spy();

    this.hub.addFilter('test', spy);
    this.hub.removeFilter('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'does not remove matcher if filtered': function () {
    this.hub.addFilter('removeFilter', function () {});
    var spy = sinon.spy();

    this.hub.addFilter('test.*', spy);
    this.hub.removeFilter('test.*', spy);
    this.hub.emit('test.foo');

    sinon.assert.calledOnce(spy);
  }

});
