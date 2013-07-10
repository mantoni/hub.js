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

var hub    = require('../lib/hub');


test('hub.on', {

  'is alias for hub.addListener': function () {
    var h = hub();

    assert.strictEqual(h.on, h.addListener);
  }

});
