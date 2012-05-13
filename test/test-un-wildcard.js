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


test('hub.un wildcard', {

  before: function () {
    this.hub = hub();
  },


  'should unsubscribe one matcher': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);

    this.hub.un('test.*', spy1);
    this.hub.emit('test.a');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should unsubscribe all matchers': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);

    this.hub.un('test.*');
    this.hub.emit('test.a');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  }


});
