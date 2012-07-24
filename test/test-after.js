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


test('hub.after', {

  before: function () {
    this.hub = hub();
  },


  'should be invoked on emit': function () {
    var spy = sinon.spy();

    this.hub.after('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked after on if registered before on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.after('test', spy2);
    this.hub.on('test', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked after on if registered after on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.after('test', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  }

});
