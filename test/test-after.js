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


test('hub.after', {

  before: function () {
    this.hub = hub();
  },


  'should be invoked on emit': function () {
    var spy = sinon.spy();

    this.hub.after('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked after on if registered before on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.after('test', spy2);
    this.hub.on('test', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked after on if registered after on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.after('test', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked with the result of on': function () {
    var spy = sinon.spy();

    this.hub.on('greet', function (name) { return 'Hello ' + name; });
    this.hub.after('greet', spy);
    this.hub.emit('greet', 'cjno');

    sinon.assert.calledWith(spy, null, 'Hello cjno');
  },


  'should be invoked with the err of on': function () {
    var spy = sinon.spy();
    var err = new Error('D`oh!');

    this.hub.on('greet', sinon.stub().throws(err));
    this.hub.after('greet', spy);
    this.hub.emit('greet', 'cjno', function () {});

    sinon.assert.calledWith(spy, err);
  },


  'should register event-function pair': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    this.hub.after({
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

    this.hub.after(type);
    this.hub.emit('test');

    sinon.assert.called(type.test);
  },


  'should not throw if called with non function values': function () {
    var hub = this.hub;

    assert.doesNotThrow(function () {
      hub.after({
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
