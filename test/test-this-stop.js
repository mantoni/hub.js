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


test('this.stop', {

  before: function () {
    this.hub = hub();
  },


  'should stop emitted event in on(*)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.on('*', function () {
      this.stop();
    });
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should stop emitted event in before(*)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.before('*', function () {
      this.stop();
    });
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
  },


  'should stop emitted event in before(test)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.before('test', function () {
      this.stop();
    });
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should stop emitted event in on(test)': function () {
    var spy = sinon.spy();
    this.hub.after('test', spy);

    this.hub.on('test', function () {
      this.stop();
    });
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'should return result if stopped in on(test)': function () {
    var spy = sinon.spy();

    this.hub.on('test', function () {
      this.stop();
      return 'some result';
    });
    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'some result');
  },


  'should stop emitted event in after(test)': function () {
    var spy = sinon.spy();
    this.hub.after('*', spy);

    this.hub.after('test', function () {
      this.stop();
    });
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  }


});
