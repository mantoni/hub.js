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
  }

});
