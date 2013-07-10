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


test('hub.once', {

  before: function () {
    this.hub = hub();
  },

  'unsubscribes after first emit': function () {
    var spy = sinon.spy();

    this.hub.once('test', spy);
    this.hub.emit('test');
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener again if it emits same event': function () {
    var self = this;
    var spy  = sinon.spy(function () {
      self.hub.emit('a');
    });

    this.hub.once('a', spy);
    assert.doesNotThrow(function () {
      self.hub.emit('a');
    });

    sinon.assert.calledOnce(spy);
  },

  'does not invoke listener again if it emits same wildcard event':
    function () {
      var self = this;
      var spy  = sinon.spy(function () {
        self.hub.emit('a.b.c');
      });

      this.hub.once('a.**', spy);
      assert.doesNotThrow(function () {
        self.hub.emit('a.b.c');
      });

      sinon.assert.calledOnce(spy);
    },

  'does not add additional listeners': function () {
    this.hub.once('test', function () {});

    assert.equal(this.hub.listeners('test').length, 1);
  },

  'passes arguments': function () {
    var spy = sinon.spy();

    this.hub.once('test', spy);
    this.hub.emit('test', 'abc', 123);

    sinon.assert.calledWith(spy, 'abc', 123);
  },

  'works with callbacks': function () {
    var spy = sinon.spy();

    this.hub.once('test', function (a, b, callback) {
      callback(null, a + b);
    });
    this.hub.emit('test', 'a', 'b', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, 'ab');
  }

});
