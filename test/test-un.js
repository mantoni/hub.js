/*jslint plusplus: true, vars: true, node: true, indent: 2, maxlen: 78 */
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


test('hub.un', {

  before: function () {
    this.hub = hub();
  },


  'should unsubscribe given callback only': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.on('test', spy2);

    this.hub.un('test', spy1);
    this.hub.emit('test');

    sinon.assert.notCalled(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should unsubscribe all callbacks': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('test', spy1);
    this.hub.on('test', spy2);

    this.hub.un('test');
    this.hub.emit('test');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  },


  'should ignore unknown event names': function () {
    var self = this;

    assert.doesNotThrow(function () {
      self.hub.un('test', function () {});
    });
  },


  'should not fail if un is called in emit': function () {
    var self  = this;
    var fn    = function () {};
    this.hub.on('test', function () {
      self.hub.un('test', fn);
    });
    this.hub.on('test', fn);

    assert.doesNotThrow(function () {
      self.hub.emit('test');
    });
  }


});
