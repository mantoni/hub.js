/**
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


test('emit-options', {

  before: function () {
    this.hub = hub();
  },

  'does not pass options to listener': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test', 42, hub.options({}));

    sinon.assert.calledWithExactly(spy, 42);
  },


  'uses callback followed by options': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { return 42; });

    this.hub.emit('test', hub.options({}), spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 42);
  },


  'passes function preceeding options to listeners': function () {
    var fn  = function () {};
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test', fn, hub.options({}));

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, fn);
  }

});
