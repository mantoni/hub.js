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


test('hub.un', {

  'is alias for hub.un': function () {
    var h = hub();

    assert.strictEqual(h.un, h.removeListener);
  }

});
