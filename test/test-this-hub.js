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


test('this.hub', {

  before: function () {
    this.hub = hub();
  },

  'is hub instance in on(*)': function () {
    var spy = sinon.spy();
    this.hub.on('*', spy);

    this.hub.emit('test');

    assert.strictEqual(spy.thisValues[0].hub, this.hub);
  },

  'is hub instance in on(test)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test');

    assert.strictEqual(spy.thisValues[0].hub, this.hub);
  }

});
