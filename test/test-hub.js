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
var strategy  = require('../lib/strategy');


test('hub', {


  'should create instance of Hub': function () {
    assert(hub() instanceof hub.Hub);
  },


  'should expose strategy.LAST': function () {
    assert.strictEqual(hub.LAST, strategy.LAST);
  },


  'should expose strategy.CONCAT': function () {
    assert.strictEqual(hub.CONCAT, strategy.CONCAT);
  },


  'should call on for each key-function pair': sinon.test(function () {
    this.stub(hub.Hub.prototype, "on");
    var listener1 = function () {};
    var listener2 = function () {};

    hub({
      'a' : listener1,
      'b' : listener2
    });

    sinon.assert.calledTwice(hub.Hub.prototype.on);
    sinon.assert.calledWith(hub.Hub.prototype.on, 'a', listener1);
    sinon.assert.calledWith(hub.Hub.prototype.on, 'b', listener2);
  }),


  'should call on for function on prototype': sinon.test(function () {
    this.stub(hub.Hub.prototype, "on");
    function Type() {}
    Type.prototype.test = function () {};
    var type = new Type();

    hub(type);

    sinon.assert.calledOnce(hub.Hub.prototype.on);
    sinon.assert.calledWith(hub.Hub.prototype.on, 'test', type.test);
  }),


  'should not call on with non-function values': sinon.test(function () {
    this.stub(hub.Hub.prototype, "on");

    hub({
      'a' : 'x',
      'b' : 123,
      'c' : true,
      'd' : {},
      'e' : new Date()
    });

    sinon.assert.notCalled(hub.Hub.prototype.on);
  })


});
