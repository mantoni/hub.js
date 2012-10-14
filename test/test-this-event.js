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


test('this.event', {

  before: function () {
    this.hub = hub();
  },


  'should be emitted event in on(*)': function () {
    var spy = sinon.spy();
    this.hub.on('*', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  },


  'should be emitted event in before(test)': function () {
    var spy = sinon.spy();
    this.hub.before('test', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  },


  'should be emitted event in on(test)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  },


  'should be emitted event in after(test)': function () {
    var spy = sinon.spy();
    this.hub.after('test', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  }


});
