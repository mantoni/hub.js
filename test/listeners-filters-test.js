/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it, beforeEach, afterEach*/
'use strict';

var assert = require('assert');
var sinon  = require('sinon');
var hub    = require('../lib/hub');


describe('listeners', function () {
  var h;

  beforeEach(function () {
    h = new hub.Hub();
  });

  it('returns empty list by default', function () {
    var a = h.listeners();

    assert.deepEqual(a, []);
  });

});


describe('filters', function () {
  var h;

  beforeEach(function () {
    h = new hub.Hub();
  });

  it('returns empty list by default', function () {
    var a = h.filters();

    assert.deepEqual(a, []);
  });

});
