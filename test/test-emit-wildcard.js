/**
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


  'should invoke matching "on" listeners': matchingListeners("on"),


  'should invoke matching "on" matchers': matchingMatchers("on"),


  'should not invoke not matching "on" matchers': notMatchingMatchers("on"),


  'should invoke matching "before" listeners': matchingListeners("before"),


  'should invoke matching "before" matchers': matchingMatchers("before"),


  'should not invoke not matching "before" matchers':
    notMatchingMatchers("before"),


  'should invoke matching "after" listeners': matchingListeners("after"),


  'should invoke matching "after" matchers': matchingMatchers("after"),


  'should not invoke not matching "after" matchers':
    notMatchingMatchers("after"),


  'should invoke "before" listeners before "on" listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub.before('test.*',   spy1);
    this.hub.before('test.run', spy2);
    this.hub.on('test.run',     spy3);

    this.hub.emit('test.*');

    sinon.assert.callOrder(spy1, spy2, spy3);
  },


  'should invoke "after" listeners after "on" listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub.on('test.run',     spy1);
    this.hub.after('test.run',  spy2);
    this.hub.after('test.*',    spy3);

    this.hub.emit('test.*');

    sinon.assert.callOrder(spy1, spy2, spy3);
  },


  'should invoke "after" listener with result of "on" listener': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { return 'Oh, hi!'; });
    this.hub.after('test', spy);

    this.hub.emit('*');

    sinon.assert.calledWith(spy, null, "Oh, hi!");
  },


  'should invoke "before" listeners in parallel': function () {
    var spy = sinon.spy(function (callback) {
      throw new Error();
    });
    this.hub.before('test.a', spy);
    this.hub.before('test.b', spy);

    this.hub.emit('test.*', function () {});

    sinon.assert.calledTwice(spy);
  },


  'should invoke "after" listeners in parallel': function () {
    var spy = sinon.spy(function (callback) {
      throw new Error();
    });
    this.hub.after('test.a', spy);
    this.hub.after('test.b', spy);

    this.hub.emit('test.*');

    sinon.assert.calledTwice(spy);
  },


  'should invoke "before" matchers in parallel': function () {
    var spy = sinon.spy(function (callback) {
      throw new Error();
    });
    this.hub.before('test.a.*', spy);
    this.hub.before('test.b.*', spy);

    this.hub.emit('test.**', function () {});

    sinon.assert.calledTwice(spy);
  },


  'should invoke "after" matchers in parallel': function () {
    var spy = sinon.spy(function (callback) {
      throw new Error();
    });
    this.hub.after('test.a.*', spy);
    this.hub.after('test.b.*', spy);

    this.hub.emit('test.**');

    sinon.assert.calledTwice(spy);
  }


});
