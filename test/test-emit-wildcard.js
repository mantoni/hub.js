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
    this.hub[method]('foo.*',      spy2);
    this.hub[method]('foo.*.test', spy3);
    // register ** last to avoid catching newLIsteners:
    this.hub[method]('**',         spy1);

    this.hub.emit('foo.**');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
  };
}

function notMatchingMatchers(method) {
  return function () {
    var spy = sinon.spy();
    this.hub[method]('*.bar',    spy);
    this.hub[method]('**.bar',   spy);
    this.hub[method]('foo',      spy);
    this.hub[method]('bar.foo',  spy);

    this.hub.emit('foo.**');

    sinon.assert.notCalled(spy);
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
    this.hub.before('test', spy1);
    this.hub.on('test', spy2);

    this.hub.emit('*');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke "after" listeners after "on" listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.after('test', spy2);

    this.hub.emit('*');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke "after" listener with result of "on" listener': function () {
    var spy = sinon.spy();
    this.hub.on('test', function () { return 'Oh, hi!'; });
    this.hub.after('test', spy);

    this.hub.emit('*');

    sinon.assert.calledWith(spy, null, "Oh, hi!");
  },


  'should work with all lower case letters': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('abcdefghijklmnopqrstuvwxyz');

    sinon.assert.calledOnce(spy);
  },


  'should work with all upper case letters': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

    sinon.assert.calledOnce(spy);
  },


  'should allow underscores': function () {
    var spy = sinon.spy();

    this.hub.on('*', spy);
    this.hub.emit('Test_Me');

    sinon.assert.calledOnce(spy);
  }


});
