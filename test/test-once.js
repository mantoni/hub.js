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


function unsubscribeTests(method) {
  return {

    before: function () {
      this.hub = hub();
    },


    'should unsubscribe after first emit': function () {
      var spy = sinon.spy();

      this.hub[method]('test', spy);
      this.hub.emit('test');
      this.hub.emit('test');

      sinon.assert.calledOnce(spy);
    },


    'should not invoke listener again if it emits same event': function () {
      var self  = this;
      var spy   = sinon.spy(function () {
        self.hub.emit('a');
      });

      this.hub[method]('a', spy);
      assert.doesNotThrow(function () {
        self.hub.emit('a');
      });

      sinon.assert.calledOnce(spy);
    }

  };
}

function argumentsTests(method) {
  return {

    before: function () {
      this.hub = hub();
    },


    'should pass arguments': function () {
      var spy = sinon.spy();

      this.hub[method]('test', spy);
      this.hub.emit('test', 'abc', 123);

      sinon.assert.calledWith(spy, 'abc', 123);
    },


    'should work with callbacks': function () {
      var spy = sinon.spy();

      this.hub[method]('test', function (a, b, callback) {
        callback(null, a + b);
      });
      this.hub.emit('test', 'a', 'b', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, 'ab');
    }

  };
}


test('hub.once unsubscribe',        unsubscribeTests('once'));
test('hub.once arguments',          argumentsTests('once'));
test('hub.onceBefore unsubscribe',  unsubscribeTests('onceBefore'));
test('hub.onceBefore arguments',    argumentsTests('onceBefore'));
test('hub.onceAfter unsubscribe',   unsubscribeTests('onceAfter'));

test('hub.onceAfter arguments', {

  before: function () {
    this.hub = hub();
  },


  'should pass results': function () {
    var spy = sinon.spy();

    this.hub.onceAfter('test', spy);
    this.hub.on('test', function () { return 'abc'; });
    this.hub.emit('test', 123);

    sinon.assert.calledWith(spy, null, 'abc');
  },


  'should pass errors': function () {
    var spy = sinon.spy();
    var err = new Error('whoups!');

    this.hub.onceAfter('test', spy);
    this.hub.on('test', function () { throw err; });
    this.hub.emit('test', function () {/* swallow error */});

    sinon.assert.calledWith(spy, err);
  }

});

test('hub.once/before/after call order', {

  before: function () {
    this.hub = hub();
  },


  'should register before listener': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();

    this.hub.onceAfter('test', spy3);
    this.hub.once('test', spy2);
    this.hub.onceBefore('test', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2, spy3);
  }

});