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


test('hub.un', {

  before: function () {
    this.hub = hub();
  },


  'should unsubscribe given on listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.on('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },


  'should unsubscribe given before listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.before('test', spy1);
    this.hub.before('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },


  'should unsubscribe given after listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.after('test', spy1);
    this.hub.after('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },


  'should not unsubscribe different listener': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.un('test', function () {});
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.calledTwice(spy);
  },


  'should not fail if un is called in emit': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('test', function () {
      self.hub.un('test', fn);
    });
    this.hub.on('test', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  },


  'should unregister event-function pair': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.on({
      'a' : listener1,
      'b' : listener2
    });
    this.hub.un({
      'a' : listener1,
      'b' : listener2
    });
    this.hub.emit('a');
    this.hub.emit('b');

    sinon.assert.notCalled(listener1);
    sinon.assert.notCalled(listener2);
  },


  'should unregister event-function pair with prefix': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.on('test', {
      'a' : listener1,
      'b' : listener2
    });
    this.hub.un('test', {
      'a' : listener1,
      'b' : listener2
    });
    this.hub.emit('test.a');
    this.hub.emit('test.b');

    sinon.assert.notCalled(listener1);
    sinon.assert.notCalled(listener2);
  },


  'should unregister function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.on(type);
    this.hub.un(type);
    this.hub.emit('test');

    sinon.assert.notCalled(type.test);
  },


  'should unregister function from prototype with prefix': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.on('a', type);
    this.hub.un('a', type);
    this.hub.emit('a.test');

    sinon.assert.notCalled(type.test);
  },


  'should not throw if called with non function values': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.un({
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


  'should not throw if called with non function values with prefix':
    function () {
      var hub = this.hub;

      assert.doesNotThrow(function () {
        hub.un('test', {
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


  'does not invoke listener unregistered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', spy);
    hub.on('test.b', function () {});
    hub.emit('test.*');
    spy.reset();

    hub.un('test.a', spy);
    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  }

});
