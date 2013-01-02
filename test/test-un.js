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

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should unsubscribe given before listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.before('test', spy1);
    this.hub.before('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should unsubscribe given after listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.after('test', spy1);
    this.hub.after('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should not unsubscribe different listener': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.un('test', function () {});
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
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


  'should register event-function pair': function () {
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


  'should register function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    this.hub.on(type);
    this.hub.un(type);
    this.hub.emit('test');

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
  }


});
