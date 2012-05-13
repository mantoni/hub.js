/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


test('pubsub', {

  before: function () {
    this.hub = hub();
  },


  'should pass message to registered listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.on('test', spy2);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should not pass message to listeners with different name': function () {
    var spy = sinon.spy();

    this.hub.on('foo', spy);
    this.hub.emit('bar');

    sinon.assert.notCalled(spy);
  },


  'should pass arguments to listener': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.on('test', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
  }


});
