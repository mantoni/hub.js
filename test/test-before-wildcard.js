/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var hub     = require('../lib/hub');


test('hub.before wildcard', {

  before: function () {
    this.hub = hub();
  },


  'should be invoked on emit': function () {
    var spy = sinon.spy();

    this.hub.before('*', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked before on if registered before on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.before('*', spy1);
    this.hub.on('*', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked before on if registered after on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*', spy2);
    this.hub.before('*', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked with arguments from emit': function () {
    var spy = sinon.spy();

    this.hub.before('*', spy);
    this.hub.emit('test', 123, 'abc', [true, false]);

    sinon.assert.calledWith(spy, 123, 'abc', [true, false]);
  }

});
