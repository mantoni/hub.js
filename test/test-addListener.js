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


test('hub.addListener', {

  before: function () {
    this.hub = hub();
  },

  'passes message to registered listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('test', spy1);
    this.hub.addListener('test', spy2);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'does not pass message to listeners with different name': function () {
    var spy = sinon.spy();

    this.hub.addListener('foo', spy);
    this.hub.emit('bar');

    sinon.assert.notCalled(spy);
  },

  'passes arguments to listener': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.addListener('test', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
  },

  'does not modify argument length for second caller 1': function () {
    var spy = sinon.spy(function (a, b) {});

    this.hub.addListener('test', function (a, b, c) {}); // more args
    this.hub.addListener('test', spy);
    this.hub.emit('test', 42);

    // Verify the second arg is not set to undefined:
    sinon.assert.calledWith(spy, 42, sinon.match.func);
  },

  'does not modify argument length for second caller 2': function () {
    var spy = sinon.spy(function (a, b) {});

    this.hub.addListener('test', function (a, b, c) { return true; });
    this.hub.addListener('test', spy);
    this.hub.emit('test', 42);

    // Verify the second arg is not set to undefined:
    sinon.assert.calledWith(spy, 42, sinon.match.func);
  },

  'invokes listener registered after emit': function () {
    var spy = sinon.spy();
    this.hub.addListener('test.a', function () {});
    this.hub.emit('test.*');

    this.hub.addListener('test.b', spy);
    this.hub.emit('test.*');

    sinon.assert.calledOnce(spy);
  },

  'subscribes to matching events': function () {
    var spy = sinon.spy();

    this.hub.addListener('test.*', spy);
    this.hub.emit('test.a');
    this.hub.emit('test.b');

    sinon.assert.calledTwice(spy);
  },

  'is invoked on single star broadcast': function () {
    var spy = sinon.spy();

    this.hub.addListener('foo.*', spy);
    this.hub.emit('*.bar');

    sinon.assert.calledOnce(spy);
  },

  'is invoked on double star broadcast': function () {
    var spy = sinon.spy();

    this.hub.addListener('foo.**', spy);
    this.hub.emit('**.bar');

    sinon.assert.calledOnce(spy);
  },

  'is not invoked on not matching events': function () {
    var spy = sinon.spy();

    this.hub.addListener('foo.*', spy);
    this.hub.emit('bar.x');

    sinon.assert.notCalled(spy);
  },

  'emits to matcher and exact match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('test.*', spy1);
    this.hub.addListener('test.a', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'subscribes twice to same matcher': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('test.*', spy1);
    this.hub.addListener('test.*', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'receives arguments from emit': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.addListener('*', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
  },

  'stops at dot at end': function () {
    var spy = sinon.spy();

    this.hub.addListener('test.*', spy);
    this.hub.emit('test.a.b');

    sinon.assert.notCalled(spy);
  },

  'stops at dot at start': function () {
    var spy = sinon.spy();

    this.hub.addListener('*.test', spy);
    this.hub.emit('a.b.test');

    sinon.assert.notCalled(spy);
  },

  'supports multiple wildcards': function () {
    var spy = sinon.spy();

    this.hub.addListener('a.*.c.*.e', spy);
    this.hub.emit('a.b.c.d.e');

    sinon.assert.calledOnce(spy);
  },

  'does not stop at dot': function () {
    var spy = sinon.spy();

    this.hub.addListener('test.**', spy);
    this.hub.emit('test.a.b');

    sinon.assert.calledOnce(spy);
  },

  'supports multiple double wildcards': function () {
    var spy = sinon.spy();

    this.hub.addListener('**.test.**', spy);
    this.hub.emit('a.b.test.c.d');

    sinon.assert.calledOnce(spy);
  },

  'invokes **.bar.test before *.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('*.bar.*', spy2);
    this.hub.addListener('**.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes *.bar.* before *.bar.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('*.bar.test', spy2);
    this.hub.addListener('*.bar.*', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes *.bar.test before foo.**': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('foo.**', spy2);
    this.hub.addListener('*.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes foo.** before foo.*.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('foo.*.test', spy2);
    this.hub.addListener('foo.**', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes foo.*.test before foo.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.addListener('foo.bar.*', spy2);
    this.hub.addListener('foo.*.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },

  'invokes matcher registered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.addListener('a.*', function () {});
    hub.emit('*.*');

    hub.addListener('b.*', spy);
    hub.emit('*.*');

    sinon.assert.calledOnce(spy);
  },

  'invokes listener added in listener': function () {
    var spy = sinon.spy();

    this.hub.addListener('test', function () {
      this.hub.addListener('test', spy);
    });
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'invokes listener added in wildcard listener': function () {
    var spy = sinon.spy();

    this.hub.addListener('*', function () {
      this.hub.addListener('test', spy);
    });
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'invokes wildcard listener added in wildcard listener': function () {
    var spy = sinon.spy();

    this.hub.addListener('*', function () {
      this.hub.addListener('*', spy);
    });
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'invokes more specific wildcard listener inserted in wildcard listener':
    function () {
      var spy = sinon.spy();

      this.hub.addListener('**', function () {
        this.hub.addListener('test.**', spy);
      });
      this.hub.addListener('test.a.*', function () {});
      this.hub.emit('test.a.b');

      sinon.assert.calledOnce(spy);
    },

  'does not invoke listener twice if more specific was already registered':
    function () {
      var spy = sinon.spy();

      this.hub.addListener('test.*', function () {});
      this.hub.addListener('**', spy);
      this.hub.emit('test.x');

      sinon.assert.calledOnce(spy);
    }

});


function emitsNewListener(method, event) {
  return function () {
    var spy      = sinon.spy();
    var listener = function () {};

    this.hub.on('newListener', spy);
    this.hub[method](event, listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, event, listener);
  };
}

test('event.newListener', {

  before: function () {
    this.hub = hub();
  },

  'emits for on(test)': emitsNewListener('on', 'test'),

  'emits for on(**)': emitsNewListener('on', '**'),

  'emits for once(test)': emitsNewListener('once', 'test'),

  'emits for once(**)': emitsNewListener('once', '**'),

  'does not add listener if filtered': function () {
    this.hub.addFilter('newListener', function () {});
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not add matcher if filtered': function () {
    this.hub.addFilter('newListener', function () {});
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('test');

    sinon.assert.notCalled(spy);
  },

  'does not emit newListener event to matcher': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.on('test', function () {});

    sinon.assert.notCalled(spy);
  }

});
