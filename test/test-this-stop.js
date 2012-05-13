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


test('this.stop', {

  before: function () {
    this.hub = hub();
  },


  'should stop emitted event in wildcard listener': function () {
    var spy = sinon.spy();
    this.hub.on('*', function () {
      this.stop();
    });
    this.hub.on('test', spy);

    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should not stop other matchers': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('*', spy1);
    this.hub.on('*', function () {
      this.stop();
    });
    this.hub.on('*', spy2);

    this.hub.emit('test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  }


});
