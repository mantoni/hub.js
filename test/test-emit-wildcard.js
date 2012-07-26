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


test('emit-wildcard', {

  before: function () {
    this.hub = hub();
  },


  'should invoke matching listeners': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub.on('a', spy1);
    this.hub.on('a', spy2);
    this.hub.on('b', spy3);

    this.hub.emit('*');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
  },


  'should invoke matching matchers': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    var spy3 = sinon.spy();
    this.hub.on('**',         spy1);
    this.hub.on('foo.*',      spy2);
    this.hub.on('foo.*.test', spy3);

    this.hub.emit('foo.**');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
    sinon.assert.calledOnce(spy3);
  },


  'should not invoke not matching matchers': function () {
    var spy = sinon.spy();
    this.hub.on('*.bar',    spy);
    this.hub.on('**.bar',   spy);
    this.hub.on('foo',      spy);
    this.hub.on('bar.foo',  spy);

    this.hub.emit('foo.**');

    sinon.assert.notCalled(spy);
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
