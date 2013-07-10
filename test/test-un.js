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


test('hub.un', {

  before: function () {
    this.hub = hub();
  },

  'unsubscribes given given listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.on('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },

  'unsubscribes given once listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.once('test', spy1);
    this.hub.once('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'does not fail if un is called in emit': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('test', function () {
      self.hub.un('test', fn);
    });
    this.hub.on('test', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  },

  'does not invoke listener unregistered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', spy);
    hub.on('test.b', function () {});
    hub.emit('test.*');
    spy.reset();

    hub.un('test.a', spy);
    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  }

});
