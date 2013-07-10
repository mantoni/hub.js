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


test('characters', {

  before: function () {
    this.hub = hub();
  },

  'works with all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('abcdefghijklmnopqrstuvwxyz', spy);
    this.hub.emit('abcdefghijklmnopqrstuvwxyz');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'works with all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('ABCDEFGHIJKLMNOPQRSTUVWXYZ', spy);
    this.hub.emit('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'supports underscores': function () {
    var spy = sinon.spy();

    this.hub.on('Test_Me', spy);
    this.hub.emit('Test_Me');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'supports dashes': function () {
    var spy = sinon.spy();

    this.hub.on('Test-Me', spy);
    this.hub.emit('Test-Me');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'supports numbers': function () {
    var spy = sinon.spy();

    this.hub.on('1234567890', spy);
    this.hub.emit('1234567890');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'supports colons': function () {
    var spy = sinon.spy();

    this.hub.on('Test:Me', spy);
    this.hub.emit('Test:Me');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },

  'does not confuse call order if numbers are used': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('a.*', spy1);
    this.hub.on('9876543210.*', spy2);

    this.hub.emit('**');

    sinon.assert.callOrder(spy1, spy2);
  }

});
