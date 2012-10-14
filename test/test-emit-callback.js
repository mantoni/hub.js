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


  'should throw if listener threw and event was stopped': function () {
    var caught;
    this.hub.on('test', function () {
      this.stop();
      throw new Error('oups');
    });

    try {
      this.hub.emit('test');
    } catch (e) {
      caught = e;
    }

    assert.equal(caught.message, 'oups');
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
      this.hub.on('test.*', function (callback) {
        setTimeout(callback, 20);
      });
      this.hub.on('test.*', function (callback) {
        setTimeout(callback, 10);
      });

      this.hub.emit('test.run', spy);

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
      'ErrorList: Multiple callbacks err\'d:\n' +
      '  - TypeError: a\n' +
      '  - RangeError: b');
    assert(error instanceof Error);
  },


  'should err ErrorList for callback err and exception': function () {
    var spy   = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(new TypeError('a'));
    });
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof Error);
  },


  'should err ErrorList if all listeners throw': function () {
    var spy   = sinon.spy();
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof Error);
  },


  'should throw ErrorList if all listeners throw': function () {
    var self  = this;
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    assert.throws(function () {
      self.hub.emit('test');
    }, /^ErrorList/);
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
  ),


  'should pass callback as last arg if fewer args are emitted': function () {
    this.hub.on('test', function (a, b, callback) {
      callback("value");
    });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, "value");
  },


  'should use null return value if fewer args are emitter': function () {
    this.hub.on('test', function (a, b) {
      return null;
    });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null);
  },


  'should use the same scope in callbacks as in listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.emit('test', spy2);

    assert.strictEqual(spy2.thisValues[0], spy1.thisValues[0]);
  },


  'should use the same scope in callbacks as in listeners on error':
    function () {
      var stub  = sinon.stub().throws(new Error());
      var spy   = sinon.spy();

      this.hub.on('test', stub);
      this.hub.emit('test', spy);

      assert.strictEqual(spy.thisValues[0], stub.thisValues[0]);
    }

});
