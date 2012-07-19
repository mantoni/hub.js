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


test('this.event', {

  before: function () {
    this.hub = hub();
  },


  'should be emitted event in wildcard listener': function () {
    var spy = sinon.spy();
    this.hub.on('*', spy);

    this.hub.emit('test');

    assert.equal(spy.thisValues[0].event, 'test');
  }


});
