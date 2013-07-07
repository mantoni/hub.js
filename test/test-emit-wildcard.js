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
