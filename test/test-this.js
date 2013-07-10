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


var before = function () {
  this.hub = hub();
};


test('this.hub', {

  before: before,

  'is hub instance in on(*)': function () {
    var spy = sinon.spy();
    this.hub.on('*', spy);

    this.hub.emit('test');

    assert.strictEqual(spy.thisValues[0].hub, this.hub);
  },

  'is hub instance in on(test)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test');

    assert.strictEqual(spy.thisValues[0].hub, this.hub);
  }

});


test('this.event', {

  before: before,

  'is emitted event in on(*)': function () {
    var spy = sinon.spy();
    this.hub.on('*', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  },

  'is emitted event in on(test)': function () {
    var spy = sinon.spy();
    this.hub.on('test', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  }

});


function callbackTests(event) {
  return {

    before: before,

    'returns function': function () {
      var result;

      this.hub.on(event, function () {
        result = this.callback();
      });
      this.hub.emit('test');

      assert.equal(typeof result, 'function');
    },

    'resolves with value': function () {
      var spy = sinon.spy();

      this.hub.on(event, function () {
        var callback = this.callback();
        callback(null, 'value');
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, 'value');
    },

    'resolves with error': function () {
      var spy = sinon.spy();
      var err = new Error();

      this.hub.on(event, function () {
        var callback = this.callback();
        callback(err);
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, err);
    },

    'adds value with callback.push': function () {
      var spy = sinon.spy();

      this.hub.on(event, function () {
        this.callback.push('a');
        this.callback.push('b');
      });
      this.hub.emit({ event : 'test', allResults : true }, spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    },

    'adds error with callback.err': function () {
      var spy = sinon.spy();
      var err1 = new Error();
      var err2 = new Error();

      this.hub.on(event, function () {
        this.callback.err(err1);
        this.callback.err(err2);
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, sinon.match({
        name    : 'ErrorList',
        errors  : [err1, err2]
      }));
    },

    'times out after given timeout millis': sinon.test(function () {
      this.hub.on('test', function () {
        this.callback(123);
      });
      var spy = sinon.spy();
      this.hub.emit('test', spy);
      this.clock.tick(122);

      sinon.assert.notCalled(spy);

      this.clock.tick(1);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithMatch(spy, {
        name : 'TimeoutError'
      });
    })

  };
}

test('this.callback matcher', callbackTests('*'));
test('this.callback listener', callbackTests('test'));


function argsTest(method, event) {
  return function () {
    var h = hub();
    var args;
    h[method](event, function () {
      args = this.args;
    });

    h.emit('test', 123, 'abc', [true, false]);

    assert.deepEqual(args, [123, 'abc', [true, false]]);
  };
}


test('this.args', {

  'returns emitted arguments in on(*)'    : argsTest('on', '*'),
  'returns emitted arguments in on(test)' : argsTest('on', 'test')

});


test('this.allResults', {

  before: before,

  'is false by default': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit('test');

    assert.strictEqual(allResults, false);
  },

  'is false if not configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test' });

    assert.strictEqual(allResults, false);
  },

  'is false if configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test', allResults : false });

    assert.strictEqual(allResults, false);
  },

  'is true if configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test', allResults : true });

    assert.strictEqual(allResults, true);
  }

});
