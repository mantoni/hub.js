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


test('hub.removeAllMatching', {

  before: function () {
    this.hub = hub();
  },


  'should remove exact match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.1', spy1);
    this.hub.on('test.2', spy2);

    this.hub.removeAllMatching('test.1');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove exact wildcard match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.*', spy1);
    this.hub.on('test.x.y', spy2);

    this.hub.removeAllMatching('test.*');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove single wildcard match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.1', spy1);
    this.hub.on('test.2', spy2);

    this.hub.removeAllMatching('*.1');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove double wildcard match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.1.a', spy1);
    this.hub.on('test.2.b', spy2);

    this.hub.removeAllMatching('**.a');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove single wildcard event': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.a.*', spy1);
    this.hub.on('test.b.*', spy2);

    this.hub.removeAllMatching('*.a.*');
    this.hub.emit('test.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove double wildcard event': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('**.a.test.foo', spy1);
    this.hub.on('**.b.test.foo', spy2);

    this.hub.removeAllMatching('**.a.**');
    this.hub.emit('**');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should remove generic with more specific': function () {
    var spy = sinon.spy();
    this.hub.on('**.a', spy);

    this.hub.removeAllMatching('test.a');
    this.hub.emit('test.a');

    sinon.assert.notCalled(spy);
  }

});
