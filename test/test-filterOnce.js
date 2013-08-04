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


test('hub.filterOnce', {

  before: function () {
    this.hub = hub();
  },

  'unsubscribes after first emit': function () {
    var spy = sinon.spy();

    this.hub.filterOnce('test', spy);
    this.hub.emit('test');
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke filter again if it emits same event': function () {
    var self = this;
    var spy  = sinon.spy(function () {
      self.hub.emit('a');
    });

    this.hub.filterOnce('a', spy);
    assert.doesNotThrow(function () {
      self.hub.emit('a');
    });

    sinon.assert.calledOnce(spy);
  },

  'does not invoke filter again if it emits same wildcard event':
    function () {
      var self = this;
      var spy  = sinon.spy(function () {
        self.hub.emit('a.b.c');
      });

      this.hub.filterOnce('a.**', spy);
      assert.doesNotThrow(function () {
        self.hub.emit('a.b.c');
      });

      sinon.assert.calledOnce(spy);
    },

  'does not add additional filters or listeners': function () {
    this.hub.filterOnce('test', function () {});

    //assert.equal(this.hub.filters('test').length, 1);
    assert.equal(this.hub.listeners('test').length, 0);
  },

  'calls given callback with next and callback': function () {
    var filter   = sinon.spy(function (next, callback) { next(callback); });
    var listener = sinon.spy();

    this.hub.filterOnce('test', filter);
    this.hub.addListener('test', listener);
    this.hub.emit('test');

    sinon.assert.calledOnce(listener);
    sinon.assert.callOrder(filter, listener);
  },

  'exposes hub, event and args on scope': function () {
    var spy = sinon.spy();
    this.hub.filterOnce('test', spy);

    this.hub.emit('test', 123, '42');

    assert.strictEqual(spy.firstCall.thisValue.hub, this.hub);
    assert.strictEqual(spy.firstCall.thisValue.event, 'test');
    assert.deepEqual(spy.firstCall.thisValue.args, [123, '42']);
  }

});
