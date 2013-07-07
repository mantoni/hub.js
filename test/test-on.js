/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var hub    = require('../lib/hub');


test('hub.on', {

  before: function () {
    this.hub = hub();
  },

  'works with all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('abcdefghijklmnopqrstuvwxyz', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'works with all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('ABCDEFGHIJKLMNOPQRSTUVWXYZ', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports underscores': function () {
    var spy = sinon.spy();

    this.hub.on('Test_Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports dashes': function () {
    var spy = sinon.spy();

    this.hub.on('Test-Me', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'supports numbers': function () {
    var spy = sinon.spy();

    this.hub.on('1234567890', spy);
    this.hub.emit('*');

    sinon.assert.calledOnce(spy);
  },

  'does not confuse call order if numbers are used': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('a.*', spy1);
    this.hub.on('9876543210.*', spy2);

    this.hub.emit('**');

    sinon.assert.callOrder(spy1, spy2);
  },

  'registers event-function pair': function () {
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

  'registers event-function pair with prefix': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.on('test', {
      'a' : listener1,
      'b' : listener2
    });
    this.hub.emit('test.a');
    this.hub.emit('test.b');

    sinon.assert.called(listener1);
    sinon.assert.called(listener2);
  },

  'registers function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.on(type);
    this.hub.emit('test');

    sinon.assert.called(type.test);
  },

  'registers function from prototype with prefix': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.on('a', type);
    this.hub.emit('a.test');

    sinon.assert.called(type.test);
  },

  'does not throw if called with non function values': function () {
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

  'does not throw if called with non function values with prefix':
    function () {
      var hub = this.hub;

      assert.doesNotThrow(function () {
        hub.on('test', {
          'a' : 'x',
          'b' : 123,
          'c' : true,
          'd' : {},
          'e' : new Date()
        });
        hub.emit('test.a');
        hub.emit('test.b');
        hub.emit('test.c');
        hub.emit('test.d');
        hub.emit('test.e');
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

  'invokes listener registered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', function () {});
    hub.emit('test.*');

    hub.on('test.b', spy);
    hub.emit('test.*');

    sinon.assert.calledOnce(spy);
  }

});
