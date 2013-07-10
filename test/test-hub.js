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
