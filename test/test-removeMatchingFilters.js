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


test('hub.removeMatchingFilters', {

  before: function () {
    this.hub = hub();
  },

  'removes exact match': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.1', spy1);
    this.hub.addFilter('test.2', spy2);

    this.hub.removeMatchingFilters('test.1');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes exact wildcard match': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.*', spy1);
    this.hub.addFilter('test.x.y', spy2);

    this.hub.removeMatchingFilters('test.*');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes single wildcard match': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.1', spy1);
    this.hub.addFilter('test.2', spy2);

    this.hub.removeMatchingFilters('*.1');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes double wildcard match': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.1.a', spy1);
    this.hub.addFilter('test.2.b', spy2);

    this.hub.removeMatchingFilters('**.a');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes single wildcard event': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.a.*', spy1);
    this.hub.addFilter('test.b.*', spy2);

    this.hub.removeMatchingFilters('*.a.*');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes double wildcard event': function () {
    var spy1 = sinon.spy(function (next) { next(); });
    var spy2 = sinon.spy(function (next) { next(); });
    this.hub.addFilter('**.a.test.foo', spy1);
    this.hub.addFilter('**.b.test.foo', spy2);

    this.hub.removeMatchingFilters('**.a.**');
    this.hub.emit('**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'removes generic with more specific': function () {
    var spy = sinon.spy(function (next) { next(); });
    this.hub.addFilter('**.a', spy);

    this.hub.removeMatchingFilters('test.a');
    this.hub.emit('test.a');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 1': function () {
    var spy = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.a', spy);
    this.hub.emit('test.*');
    spy.reset();

    this.hub.removeMatchingFilters('test.a');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'does not invoke listener unregistered after emit 2': function () {
    var spy = sinon.spy(function (next) { next(); });
    this.hub.addFilter('test.*', spy);
    this.hub.emit('test.a');
    spy.reset();

    this.hub.removeMatchingFilters('test.a');
    this.hub.emit('test.a');

    sinon.assert.notCalled(spy);
  }

});
