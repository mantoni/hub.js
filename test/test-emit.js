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


test('hub.emit', {

  before: function () {
    this.hub = hub();
  },

  'supports all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('abcdefghijklmnopqrstuvwxyz');

    sinon.assert.calledOnce(spy);
  },

  'supports all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    sinon.assert.calledOnce(spy);
  },

  'supports underscores': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('Test_Me');

    sinon.assert.calledOnce(spy);
  },

  'supports dashes': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('Test-Me');

    sinon.assert.calledOnce(spy);
  },

  'supports colons': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('Test:Me');

    sinon.assert.calledOnce(spy);
  },

  'supports numbers': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('1234567890');

    sinon.assert.calledOnce(spy);
  },

  'uses event name from hub.event': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit({ event : 'test' }, 42);

    sinon.assert.calledWithExactly(spy, 42);
  },

  'uses callback followed by event': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { return 42; });

    this.hub.emit({ event : 'test' }, spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 42);
  },

  'passes all listener results to callback': function () {
    this.hub.on('test', function () { return 'a'; });
    this.hub.on('test', function () { return 'b'; });
    var spy = sinon.spy();

    this.hub.emit({ event : 'test', allResults : true }, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }

});
