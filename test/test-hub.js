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
var listen    = require('listen');


test('hub', {


  'should expose listen': function () {
    assert.strictEqual(hub.listen, listen);
  },


  'should register event-function pair': function () {
    var listener1 = sinon.spy();
    var listener2 = sinon.spy();

    var instance = hub({
      'a' : listener1,
      'b' : listener2
    });
    instance.emit('a');
    instance.emit('b');

    sinon.assert.called(listener1);
    sinon.assert.called(listener2);
  },


  'should register function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    var instance = hub(type);
    instance.emit('test');

    sinon.assert.called(type.test);
  },


  'should not throw if called with non function values': function () {
    assert.doesNotThrow(function () {
      var instance = hub({
        'a' : 'x',
        'b' : 123,
        'c' : true,
        'd' : {},
        'e' : new Date()
      });
      instance.emit('a');
      instance.emit('b');
      instance.emit('c');
      instance.emit('d');
      instance.emit('e');
    });

  }


});
