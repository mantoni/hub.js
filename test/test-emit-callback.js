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
var ErrorList = require('../lib/error-list');


test('emit-callback', {

  before: function () {
    this.hub = hub();
  },


  'should invoke callback with null': function () {
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null);
  },


  'should invoke callback with Error if listener throws': function () {
    var err = new Error();
    var spy = sinon.spy();
    this.hub.on('test', sinon.stub().throws(err));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, err);
  },


  'should invoke callback with Error if wildcard listener throws':
    function () {
      var err = new Error();
      var spy = sinon.spy();
      this.hub.on('*', sinon.stub().throws(err));

      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, err);
    },


  'should throw if no callback was given and listener throws': function () {
    var caught;
    this.hub.on('test', sinon.stub().throws(new Error('oups')));

    try {
      this.hub.emit('test');
    } catch (e) {
      caught = e;
    }

    assert.equal(caught.message, 'oups');
  },


  'should throw if no callback was given and wildcard listener throws':
    function () {
      var thrown = new Error();
      var caught;
      this.hub.on('*', sinon.stub().throws(thrown));

      try {
        this.hub.emit('test');
      } catch (e) {
        caught = e;
      }

      assert.strictEqual(caught, thrown);
    },


  'should not invoke listener if wildcard listener threw': function () {
    var spy = sinon.spy();
    this.hub.on('*', sinon.stub().throws(new Error()));
    this.hub.on('test', spy);

    try {
      this.hub.emit('test');
    } catch (ignored) {}

    sinon.assert.notCalled(spy);
  },


  'should not invoke listener if wildcard listener threw with callback':
    function () {
      var spy = sinon.spy();
      this.hub.on('*', sinon.stub().throws(new Error()));
      this.hub.on('test', spy);

      this.hub.emit('test', function () {});

      sinon.assert.notCalled(spy);
    },


  'should pass listener return value to callback': function () {
    this.hub.on('test', sinon.stub().returns('test'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'test');
  },


  'should pass wildcard listener return value to callback': function () {
    this.hub.on('*', sinon.stub().returns('test'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'test');
  },


  'should pass listener callback value to callback': function () {
    var spy = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(null, 'test');
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'test');
  },


  'should pass wildcard listener callback value to callback': function () {
    var spy = sinon.spy();
    this.hub.on('*', function (callback) {
      callback(null, 'test');
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'test');
  },


  'should invoke callback after all listeners returned': sinon.test(
    function () {
      var spy = sinon.spy();
      this.hub.on('test', function (callback) {
        setTimeout(callback, 20);
      });
      this.hub.on('test', function (callback) {
        setTimeout(callback, 10);
      });

      this.hub.emit('test', spy);

      sinon.assert.notCalled(spy);
      this.clock.tick(10);
      sinon.assert.notCalled(spy);
      this.clock.tick(10);
      sinon.assert.calledOnce(spy);
    }
  ),


  'should invoke callback after all wildcard listeners returned': sinon.test(
    function () {
      var spy = sinon.spy();
      this.hub.on('*', function (callback) {
        setTimeout(callback, 20);
      });
      this.hub.on('*', function (callback) {
        setTimeout(callback, 10);
      });

      this.hub.emit('test', spy);

      sinon.assert.notCalled(spy);
      this.clock.tick(10);
      sinon.assert.notCalled(spy);
      this.clock.tick(10);
      sinon.assert.calledOnce(spy);
    }
  ),


  'should allow arguments to be expected before callback': function () {
    var spy = sinon.spy();
    this.hub.on('test', function (some, args, callback) {
      callback();
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
  },


  'should invoke callback with err from first after second returned':
    sinon.test(function () {
      var spy = sinon.spy();
      var err = new Error();
      this.hub.on('test', function (callback) {
        callback(err);
      });
      this.hub.on('test', function (callback) {
        setTimeout(callback, 10);
      });

      this.hub.emit('test', spy);

      sinon.assert.notCalled(spy);
      this.clock.tick(10);
      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, err);
    }),


  'should err ErrorList with all errors as cause': function () {
    var spy   = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(new TypeError('a'));
    });
    this.hub.on('test', function (callback) {
      callback(new RangeError('b'));
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    var error = spy.firstCall.args[0];
    assert.equal(error.toString(),
      'ErrorList: Multiple listeners err\'d:\n' +
      '  - TypeError: a\n' +
      '  - RangeError: b');
    assert(error instanceof Error);
    assert(error instanceof ErrorList);
  },


  'should err ErrorList for callback err and exception': function () {
    var spy   = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(new TypeError('a'));
    });
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof ErrorList);
  },


  'should err ErrorList if all listeners throw': function () {
    var spy   = sinon.spy();
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof ErrorList);
  },


  'should throw ErrorList if all listeners throw': function () {
    var self  = this;
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    assert.throws(function () {
      self.hub.emit('test');
    }, /ErrorList/);
  },


  'should not invoke listener before wildcard listener returned': sinon.test(
    function () {
      this.hub.on('*', function (callback) {
        setTimeout(callback, 10);
      });
      var spy = sinon.spy();
      this.hub.on('test', spy);

      this.hub.emit('test');

      sinon.assert.notCalled(spy);
    }
  )


});
