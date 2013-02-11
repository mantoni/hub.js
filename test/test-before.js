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


test('hub.before', {

  before: function () {
    this.hub = hub();
  },


  'should be invoked on emit': function () {
    var spy = sinon.spy();

    this.hub.before('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked before on if registered before on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.before('test', spy1);
    this.hub.on('test', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked before on if registered after on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy2);
    this.hub.before('test', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked with arguments from emit': function () {
    var spy = sinon.spy();

    this.hub.before('test', spy);
    this.hub.emit('test', 123, 'abc', [true, false]);

    sinon.assert.calledWith(spy, 123, 'abc', [true, false]);
  },


  'should register event-function pair': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.before({
      'a' : listener1,
      'b' : listener2
    });
    this.hub.emit('a');
    this.hub.emit('b');

    sinon.assert.called(listener1);
    sinon.assert.called(listener2);
  },


  'should register function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.before(type);
    this.hub.emit('test');

    sinon.assert.called(type.test);
  },


  'should not throw if called with non function values': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.before({
        'a' : 'x',
        'b' : 123,
        'c' : true,
        'd' : {},
        'e' : new Date()
      });
      hub.emit('a');
      hub.emit('b');
      hub.emit('c');
      hub.emit('d');
      hub.emit('e');
    });
  },


  'does not invoke matcher registrated for "before" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.before('*', spy);
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'does not invoke listener registrated for "before" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.before('test', spy);
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'invokes matcher registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.on('*', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.on('test', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes matcher registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.after('*', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.before('test', function () {
      hub.after('test', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  }


});
