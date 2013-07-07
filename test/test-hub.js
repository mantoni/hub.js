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
var listen = require('listen');


test('hub', {

  'exposes listen': function () {
    assert.strictEqual(hub.listen, listen);
  },


  'registers event-function pair': function () {
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

  'registers function from prototype': function () {
    function Type() {}
    Type.prototype.test = sinon.spy();
    var type = new Type();

    var instance = hub(type);
    instance.emit('test');

    sinon.assert.called(type.test);
  },

  'does not throw if called with non function values': function () {
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
  },

  'exposes View prototype': function () {
    var view = hub().view('test');

    assert.equal(typeof hub.View, 'function');
    assert(view instanceof hub.View);
  },

  'does not use exposed View for view creation': sinon.test(function () {
    this.stub(hub, 'View').throws(new Error());

    assert.doesNotThrow(function () {
      hub().view('test');
    });
  })

});
