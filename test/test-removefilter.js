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
  }

});
