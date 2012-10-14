/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


function invokeCallbackDelayed(callback) {
  setTimeout(function () {
    callback(null, 'a');
  }, 10);
}


test('emit-strategy', {

  before: function () {
    this.hub    = hub();
    this.clock  = sinon.useFakeTimers();
  },

  after: function () {
    this.clock.restore();
  },


  'should use LAST by default': function () {
    this.hub.on('test', sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledWith(spy, null, 'b');
  },


  'should use LAST by default with wildcards': function () {
    this.hub.on('**',     sinon.stub().returns('a'));
    this.hub.on('test.*', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test.test', spy);

    sinon.assert.calledWith(spy, null, 'b');
  },


  'should use given strategy with return values': function () {
    this.hub.on('test', sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', hub.CONCAT, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  },


  'should use given strategy with return values and wildcards': function () {
    this.hub.on('**',     sinon.stub().returns('a'));
    this.hub.on('test.*', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test.test', hub.CONCAT, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  },


  'should use given strategy with callback values': function () {
    this.hub.on('test', function (callback) { callback(null, 'a'); });
    this.hub.on('test', function (callback) { callback(null, 'b'); });
    var spy = sinon.spy();

    this.hub.emit('test', hub.CONCAT, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  },


  'should use given strategy with callback values and wildcards':
    function () {
      this.hub.on('**.test',  function (callback) { callback(null, 'a'); });
      this.hub.on('test.*',   function (callback) { callback(null, 'b'); });
      var spy = sinon.spy();

      this.hub.emit('test.test', hub.CONCAT, spy);

      sinon.assert.calledWith(spy, null, ['a', 'b']);
    },


  'should use given strategy with callback and return value': function () {
    this.hub.on('test', invokeCallbackDelayed);
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', hub.CONCAT, spy);
    this.clock.tick(10);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  },


  'should use given strategy with callback and return value and wildcards':
    function () {
      this.hub.on('**.test',  invokeCallbackDelayed);
      this.hub.on('*.test',   sinon.stub().returns('b'));
      var spy = sinon.spy();

      this.hub.emit('test.test', hub.CONCAT, spy);
      this.clock.tick(10);

      sinon.assert.calledWith(spy, null, ['a', 'b']);
    },


  'should mix wildcard and non-wildcard results': function () {
    this.hub.on('*',    sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', hub.CONCAT, spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }


});
