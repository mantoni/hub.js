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


test('emit', {

  before: function () {
    this.hub = hub();
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
