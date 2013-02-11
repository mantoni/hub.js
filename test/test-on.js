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


test('hub.on', {

  before: function () {
    this.hub = hub();
  },


  'should work with all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('abcdefghijklmnopqrstuvwxyz', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },


  'should work with all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('ABCDEFGHIJKLMNOPQRSTUVWXYZ', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },


  'should allow underscores': function () {
    var spy = sinon.spy();

    this.hub.on('Test_Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },


  'should allow dashes': function () {
    var spy = sinon.spy();

    this.hub.on('Test-Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },


  'should allow numbers': function () {
    var spy = sinon.spy();

    this.hub.on('1234567890', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },


  'should not confuse call order if numbers are used': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('a.*', spy1);
    this.hub.on('9876543210.*', spy2);

    this.hub.emit('**');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should register event-function pair': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.on({
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

    this.hub.on(type);
    this.hub.emit('test');

    sinon.assert.called(type.test);
  },


  'should not throw if called with non function values': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.on({
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


  'does not invoke listener registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('test', function () {
      hub.on('test', spy);
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'invokes matcher registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('test', function () {
      hub.after('*', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('test', function () {
      hub.after('test', spy);
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  }

});
