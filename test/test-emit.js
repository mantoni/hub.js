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


test('hub.emit', {

  before: function () {
    this.hub = hub();
  },

  'uses event name from hub.event': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit({ event : 'test' }, 42);

    sinon.assert.calledWithExactly(spy, 42);
  },

  'uses callback followed by event': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { return 42; });

    this.hub.emit({ event : 'test' }, spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 42);
  },

  'passes all listener results to callback': function () {
    this.hub.on('test', function () { return 'a'; });
    this.hub.on('test', function () { return 'b'; });
    var spy = sinon.spy();

    this.hub.emit({ event : 'test', allResults : true }, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }

});

/*
function matchingListeners(method) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub[method]('a', spy1);
    this.hub[method]('a', spy2);
    this.hub[method]('b', spy3);

    this.hub.emit('*');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
  };
}

function matchingMatchers(method) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    var spy4 = sinon.spy();
    var spy5 = sinon.spy();
    this.hub[method]('foo.*', spy2);
    this.hub[method]('foo.*.test', spy3);
    this.hub[method]('*.test', spy4);
    this.hub[method]('**.test', spy5);
    // register ** last to avoid catching newListener events:
    this.hub[method]('**', spy1);

    this.hub.emit('foo.**');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
    sinon.assert.calledOnce(spy4);
    sinon.assert.calledOnce(spy5);
  };
}

function notMatchingMatchers(method) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    var spy4 = sinon.spy();
    var spy5 = sinon.spy();
    this.hub[method]('foo.*', spy1);
    this.hub[method]('*.bar', spy2);
    this.hub[method]('foo', spy3);
    this.hub[method]('bar.foo', spy4);
    this.hub[method]('foo.bar', spy5);

    this.hub.emit('foo.bar.**');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
    sinon.assert.notCalled(spy3);
    sinon.assert.notCalled(spy4);
    sinon.assert.notCalled(spy5);
  };
}


test('emit-wildcard', {

  before: function () {
    this.hub = hub();
  },

  'invokes matching "on" listeners': matchingListeners("on"),

  'invokes matching "on" matchers': matchingMatchers("on"),

  'does not invoke not matching "on" matchers': notMatchingMatchers("on")

});


test('emit-callback', {

  before: function () {
    this.hub = hub();
  },

  'invokes callback with null': function () {
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null);
  },

  'invokes callback with Error if listener throws': function () {
    var err = new Error();
    var spy = sinon.spy();
    this.hub.on('test', sinon.stub().throws(err));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, err);
  },

  'invokes callback with Error if async listener throws': function () {
    var err = new Error();
    var spy = sinon.spy();
    this.hub.on('test', function (callback) {
      throw err;
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, err);
  },

  'invokes callback with Error if wildcard listener throws':
    function () {
      var err = new Error();
      var spy = sinon.spy();
      this.hub.on('*', sinon.stub().throws(err));

      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, err);
    },

  'throws if no callback was given and listener throws': function () {
    this.hub.on('test', sinon.stub().throws(new Error('oups')));

    try {
      this.hub.emit('test');
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'oups');
    }
  },

  'throws if no callback was given and wildcard listener throws':
    function () {
      var thrown = new Error();
      this.hub.on('*', sinon.stub().throws(thrown));

      try {
        this.hub.emit('test');
        assert.fail();
      } catch (e) {
        assert.strictEqual(e, thrown);
      }
    },

  'throws if async listener threw': function () {
    this.hub.on('test', function (callback) {
      throw new Error('oups');
    });

    try {
      this.hub.emit('test');
      assert.fail();
    } catch (e) {
      assert.equal(e.message, 'oups');
    }
  },

  'passes listener return value to callback': function () {
    this.hub.on('test', function () { return 'a'; });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'a');
  },

  'passes last called listener return value to callback': function () {
    this.hub.on('test', function () { return 'a'; });
    this.hub.on('test', function () { return 'b'; });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'b');
  },

  'passes wildcard listener return value to callback': function () {
    this.hub.on('*', function () { return 'a'; });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'a');
  },

  'passes last wildcard listener return value to callback': function () {
    this.hub.on('*', function () { return 'a'; });
    this.hub.on('*', function () { return 'b'; });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'b');
  },

  'passes listener callback value to callback': function () {
    var spy = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(null, 'test');
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'test');
  },

  'passes wildcard listener callback value to callback': function () {
    var spy = sinon.spy();
    this.hub.on('*', function (callback) {
      callback(null, 'test');
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'test');
  },

  'invokes callback after all listeners returned': sinon.test(
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

  'invokes callback after all wildcard listeners returned': sinon.test(
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

  'allows arguments to be expected before callback': function () {
    var spy = sinon.spy();
    this.hub.on('test', function (some, args, callback) {
      callback();
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
  },

  'invokes callback with err from first after second returned':
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

  'errs ErrorList with all errors as cause': function () {
    var spy   = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(new TypeError('a'));
    });
    this.hub.on('test', function (callback) {
      callback(new RangeError('b'));
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match.instanceOf(Error));
    sinon.assert.calledWithMatch(spy, {
      name    : 'ErrorList',
      message : 'Multiple callbacks err\'d:\n' +
                '  - TypeError: a\n' +
                '  - RangeError: b'
    });
  },

  'errs ErrorList for callback err and exception': function () {
    var spy   = sinon.spy();
    this.hub.on('test', function (callback) {
      callback(new TypeError('a'));
    });
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match.instanceOf(Error));
    sinon.assert.calledWithMatch(spy, {
      name    : 'ErrorList',
      message : 'Multiple callbacks err\'d:\n' +
                '  - TypeError: a\n' +
                '  - RangeError: b'
    });
  },

  'errs ErrorList if all listeners throw': function () {
    var spy   = sinon.spy();
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, sinon.match.instanceOf(Error));
    sinon.assert.calledWithMatch(spy, {
      name    : 'ErrorList',
      message : 'Multiple callbacks err\'d:\n' +
                '  - TypeError: a\n' +
                '  - RangeError: b'
    });
  },

  'throws ErrorList if all listeners throw': function () {
    var self  = this;
    this.hub.on('test', sinon.stub().throws(new TypeError('a')));
    this.hub.on('test', sinon.stub().throws(new RangeError('b')));

    assert.throws(function () {
      self.hub.emit('test');
    }, /^ErrorList/);
  },

  'passes callback as last arg if fewer args are emitted': function () {
    this.hub.on('test', function (a, b, callback) {
      callback("value");
    });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, "value");
  },

  'uses null return value if fewer args are emitter': function () {
    this.hub.on('test', function (a, b) {
      return null;
    });
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null);
  },

  'uses the same scope in callbacks as in listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test', spy1);
    this.hub.emit('test', spy2);

    assert.strictEqual(spy2.thisValues[0], spy1.thisValues[0]);
  },

  'uses the same scope in callback as in listeners on error': function () {
    var stub  = sinon.stub().throws(new Error());
    var spy   = sinon.spy();

    this.hub.on('test', stub);
    this.hub.emit('test', spy);

    assert.strictEqual(spy.thisValues[0], stub.thisValues[0]);
  }

});
*/
