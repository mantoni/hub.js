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


test('errors emitted', {

  before: function () {
    this.hub = hub();
    var err = this.err = new Error('oups');
    this.hub.on('test.ouch', function () { throw err; });
  },

  'default error event with cause': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('error', spy1);
    this.hub.on('error', spy2);

    this.hub.emit('test.ouch');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledWith(spy1, this.err);
    sinon.assert.calledWith(spy2, this.err);
  },

  'namespace error event with cause': function () {
    var spy = sinon.spy();
    this.hub.on('test.error', spy);

    this.hub.emit('test.ouch');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, this.err);
  },

  'does not invoke default handler if namespace handler is present':
    function () {
      var spy1 = sinon.spy();
      var spy2 = sinon.spy();
      this.hub.on('test.error', spy1);
      this.hub.on('error', spy2);

      this.hub.emit('test.ouch');

      sinon.assert.calledOnce(spy1);
      sinon.assert.notCalled(spy2);
    },

  'invokes second error handler if first throws and then errs': function () {
    var errorSpy   = sinon.spy();
    var errorError = new Error('uh oh');
    this.hub.on('error', function () {
      throw errorError;
    });
    this.hub.on('error', errorSpy);

    try {
      this.hub.emit('test.ouch');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'Error');
      assert.equal(e.message, 'uh oh');
    }

    sinon.assert.calledOnce(errorSpy);
    sinon.assert.calledWith(errorSpy, this.err);
  },


  'does not invoke namespace.*': function () {
    var spy = sinon.spy();
    this.hub.on('test.*', spy);

    try {
      this.hub.emit('test.ouch');
    } catch (expected) {}

    sinon.assert.calledOnce(spy); // and not twice!
  },


  'invokes namespace error handlers with original scope object': function () {
    var before = sinon.spy();
    var spy    = sinon.spy();
    this.hub.before('test.ouch', before);
    this.hub.on('test.error', spy);

    this.hub.emit('test.ouch');

    assert.strictEqual(spy.firstCall.thisValue, before.firstCall.thisValue);
  },


  'invokes root error handlers with original scope object': function () {
    var before = sinon.spy();
    var spy    = sinon.spy();
    this.hub.before('test.ouch', before);
    this.hub.on('error', spy);

    this.hub.emit('test.ouch');

    assert.strictEqual(spy.firstCall.thisValue, before.firstCall.thisValue);
  }

});
