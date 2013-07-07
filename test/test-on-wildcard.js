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


test('hub.on wildcard', {

  before: function () {
    this.hub = hub();
  },

  'subscribes to matching events': function () {
    var spy = sinon.spy();

    this.hub.on('test.*', spy);
    this.hub.emit('test.a');
    this.hub.emit('test.b');

    sinon.assert.calledTwice(spy);
  },

  'is be invoked on single star broadcast': function () {
    var spy = sinon.spy();

    this.hub.on('foo.*', spy);
    this.hub.emit('*.bar');

    sinon.assert.calledOnce(spy);
  },

  'is be invoked on double star broadcast': function () {
    var spy = sinon.spy();

    this.hub.on('foo.**', spy);
    this.hub.emit('**.bar');

    sinon.assert.calledOnce(spy);
  },

  'does not emit to not matching events': function () {
    var spy = sinon.spy();

    this.hub.on('foo.*', spy);
    this.hub.emit('bar.x');

    sinon.assert.notCalled(spy);
  },

  'emits to matcher and exact match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test.*', spy1);
    this.hub.on('test.a', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'subscribes twice to same matcher': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'receives arguments from emit': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.on('*', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
  },

  'stops at dot at end': function () {
    var spy = sinon.spy();

    this.hub.on('test.*', spy);
    this.hub.emit('test.a.b');

    sinon.assert.notCalled(spy);
  },

  'stops at dot at start': function () {
    var spy = sinon.spy();

    this.hub.on('*.test', spy);
    this.hub.emit('a.b.test');

    sinon.assert.notCalled(spy);
  },

  'supports multiple wildcards': function () {
    var spy = sinon.spy();

    this.hub.on('a.*.c.*.e', spy);
    this.hub.emit('a.b.c.d.e');

    sinon.assert.calledOnce(spy);
  },

  'does not stop at dot': function () {
    var spy = sinon.spy();

    this.hub.on('test.**', spy);
    this.hub.emit('test.a.b');

    sinon.assert.calledOnce(spy);
  },

  'supports multiple double wildcards': function () {
    var spy = sinon.spy();

    this.hub.on('**.test.**', spy);
    this.hub.emit('a.b.test.c.d');

    sinon.assert.calledOnce(spy);
  },

  'invokes **.bar.test before *.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*.bar.*', spy2);
    this.hub.on('**.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes *.bar.* before *.bar.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*.bar.test', spy2);
    this.hub.on('*.bar.*', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes *.bar.test before foo.**': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.**', spy2);
    this.hub.on('*.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes foo.** before foo.*.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.*.test', spy2);
    this.hub.on('foo.**', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes foo.*.test before foo.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.bar.*', spy2);
    this.hub.on('foo.*.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes listener registered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('a.*', function () {});
    hub.emit('*.*');

    hub.on('b.*', spy);
    hub.emit('*.*');

    sinon.assert.calledOnce(spy);
  }

});
