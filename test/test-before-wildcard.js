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


  'should be invoked on single star broadcast': function () {
    var spy = sinon.spy();

    this.hub.before('foo.*', spy);
    this.hub.emit('*.bar');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked on double star broadcast': function () {
    var spy = sinon.spy();

    this.hub.before('foo.**', spy);
    this.hub.emit('**.bar');

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
  },


  'does not invoke matcher registrated for "before" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.before('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'invokes listener registered for "before" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.before('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes matcher registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.on('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.on('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes matcher registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.after('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('*', function () {
      if (this.event !== 'newListener') {
        hub.after('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  }

});
