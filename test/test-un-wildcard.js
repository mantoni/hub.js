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


test('hub.un wildcard', {

  before: function () {
    this.hub = hub();
  },

  'should unsubscribe given on matcher only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);

    this.hub.un('test.*', spy1);
    this.hub.emit('test.a');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },

  'should not unsubscribe different matcher': function () {
    var spy = sinon.spy();
    this.hub.on('test.*', spy);

    this.hub.un('test.*', function () {});
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  },

  'should not fail if un is called in emit': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('*', function () {
      self.hub.un('*', fn);
    });
    this.hub.on('*', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  },

  'does not invoke listener unregistered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('a.*', spy);
    hub.on('b.*', function () {});
    hub.emit('*.*');
    spy.reset();

    hub.un('a.*', spy);
    hub.emit('*.*');

    sinon.assert.notCalled(spy);
  }

});
