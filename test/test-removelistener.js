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


test('hub.removeListener', {

  before: function () {
    this.hub = hub();
  },

  'unsubscribes given given listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.on('test', spy2);

    this.hub.removeListener('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },

  'unsubscribes given once listener only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.once('test', spy1);
    this.hub.once('test', spy2);

    this.hub.removeListener('test', spy1);
    this.hub.emit('test');
    this.hub.emit('*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },

  'does not fail if removeListener is called in emit': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('test', function () {
      self.hub.removeListener('test', fn);
    });
    this.hub.on('test', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  },

  'does not invoke listener unregistered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('test.a', spy);
    hub.on('test.b', function () {});
    hub.emit('test.*');
    spy.reset();

    hub.removeListener('test.a', spy);
    hub.emit('test.*');

    sinon.assert.notCalled(spy);
  },

  'unsubscribes given on matcher only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);

    this.hub.removeListener('test.*', spy1);
    this.hub.emit('test.a');
    this.hub.emit('test.*');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledTwice(spy2);
  },

  'does not unsubscribe different matcher': function () {
    var spy = sinon.spy();
    this.hub.on('test.*', spy);

    this.hub.removeListener('test.*', function () {});
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy);
  },

  'does not fail if removeListener is called in broadcast': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('*', function () {
      self.hub.removeListener('*', fn);
    });
    this.hub.on('*', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  },

  'does not invoke listener unregistered after broadcast': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('a.*', spy);
    hub.on('b.*', function () {});
    hub.emit('*.*');
    spy.reset();

    hub.removeListener('a.*', spy);
    hub.emit('*.*');

    sinon.assert.notCalled(spy);
  }

});


function emitsRemoveListener(method, event) {
  return function () {
    var spy       = sinon.spy();
    var listener  = function () {};

    this.hub[method](event, listener);
    this.hub.on('removeListener', spy);
    this.hub.un(event, listener);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, event, listener);
  };
}

test('event.removeListener', {

  before: function () {
    this.hub = hub();
  },

  'emits for on(test)': emitsRemoveListener('on', 'test'),

  'emits for on(**)': emitsRemoveListener('on', '**'),

  'emits for once(test)': emitsRemoveListener('once', 'test'),

  'emits for once(**)': emitsRemoveListener('once', '**'),

  'emits to matchers': function () {
    var spy = sinon.spy();
    var listener = function () {};

    this.hub.on('*', spy);
    this.hub.on('some.test', listener);
    this.hub.un('some.test', listener);

    sinon.assert.called(spy);
    sinon.assert.calledWith(spy, 'some.test', listener);
  },

  'does not remove listener if filtered': function () {
    this.hub.addFilter('removeListener', function () {});
    var spy = sinon.spy();

    this.hub.on('test', spy);
    this.hub.un('test', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'does not remove matcher if filtered': function () {
    this.hub.addFilter('removeListener', function () {});
    var spy = sinon.spy();

    this.hub.on('test.*', spy);
    this.hub.un('test.*', spy);
    this.hub.emit('test.foo');

    sinon.assert.calledOnce(spy);
  },

  'does not emit event for removeAllListeners': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllListeners();

    sinon.assert.notCalled(spy);
  },

  'does not emit event for removeAllListeners with event': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllListeners('test');

    sinon.assert.notCalled(spy);
  },

  'does not emit event for removeAllMatching': function () {
    var spy = sinon.spy();
    this.hub.on('removeListener', spy);
    this.hub.on('test', function () {});

    this.hub.removeAllMatching('test');

    sinon.assert.notCalled(spy);
  }

});
