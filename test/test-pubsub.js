var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');
var ErrorList = require('../lib/error-list');


test('pubsub', {

  before: function () {
    this.hub = hub.create();
  },


  'should pass message to registered listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.on('test', spy2);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should not pass message to listeners with different name': function () {
    var spy = sinon.spy();

    this.hub.on('foo', spy);
    this.hub.emit('bar');

    sinon.assert.notCalled(spy);
  },


  'should pass arguments to listener': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.on('test', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
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


  'should throw if no callback and listener throws': function () {
    this.hub.on('test', sinon.stub().throws(new Error()));
    var self = this;

    assert.throws(function () {
      self.hub.emit('test');
    }, Error);
  },


  'should pass return value to callback': function () {
    this.hub.on('test', sinon.stub().returns('test'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'test');
  },


  'should pass callback value to callback': function () {
    var spy = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(null, 'test');
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'test');
  },


  'should invoke callback after all callbacks returned': sinon.test(
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
    var err1  = new TypeError('a');
    var err2  = new RangeError('b');
    this.hub.on('test', function (callback) {
      callback(err1);
    });
    this.hub.on('test', function (callback) {
      callback(err2);
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
    var err1  = new TypeError('a');
    var err2  = new RangeError('b');
    this.hub.on('test', function (callback) {
      callback(err1);
    });
    this.hub.on('test', sinon.stub().throws(err2));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof ErrorList);
  },


  'should err ErrorList if all listeners throw': function () {
    var spy   = sinon.spy();
    var err1  = new TypeError('a');
    var err2  = new RangeError('b');
    this.hub.on('test', sinon.stub().throws(err1));
    this.hub.on('test', sinon.stub().throws(err2));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    assert(spy.firstCall.args[0] instanceof ErrorList);
  },


  'should throw ErrorList if all listeners throw': function () {
    var err1  = new TypeError('a');
    var err2  = new RangeError('b');
    var self  = this;
    this.hub.on('test', sinon.stub().throws(err1));
    this.hub.on('test', sinon.stub().throws(err2));

    assert.throws(function () {
      self.hub.emit('test');
    }, /ErrorList/);
  }


});
