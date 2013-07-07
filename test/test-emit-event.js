/*
 * hub.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var hub    = require('../lib/hub');


test('emit-event', {

  before: function () {
    this.hub = hub();
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
