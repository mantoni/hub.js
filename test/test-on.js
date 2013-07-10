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


test('hub.on', {

  before: function () {
    this.hub = hub();
  },

  'works with all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('abcdefghijklmnopqrstuvwxyz', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'works with all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('ABCDEFGHIJKLMNOPQRSTUVWXYZ', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports underscores': function () {
    var spy = sinon.spy();

    this.hub.on('Test_Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports dashes': function () {
    var spy = sinon.spy();

    this.hub.on('Test-Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports numbers': function () {
    var spy = sinon.spy();

    this.hub.on('1234567890', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'does not confuse call order if numbers are used': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('a.*', spy1);
    this.hub.on('9876543210.*', spy2);

    this.hub.emit('**');

    sinon.assert.callOrder(spy1, spy2);
  },

  'does not invoke listener registered during "on"': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('test', function () {
      hub.on('test', spy);
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'invokes listener registered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', function () {});
    hub.emit('test.*');

    hub.on('test.b', spy);
    hub.emit('test.*');

    sinon.assert.calledOnce(spy);
  }

});
