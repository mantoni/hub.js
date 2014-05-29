/*
 * hub.js
 *
 * Copyright (c) 2012-2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it*/
'use strict';

var assert       = require('assert');
var Filter       = require('glob-filter').Filter;
var AsyncEmitter = require('async-glob-events').AsyncEmitter;
var hub          = require('../lib/hub');


describe('create', function () {

  it('returns an instance of Hub', function () {
    var h = hub.create();

    assert(h instanceof hub.Hub);
  });

  it('returns an instance of AsyncEmitter', function () {
    var h = hub.create();

    assert(h instanceof AsyncEmitter);
  });

  it('implements filter functions', function () {
    var h = hub.create();

    assert.strictEqual(h.addFilter, Filter.prototype.addFilter);
    assert.strictEqual(h.filterOnce, Filter.prototype.filterOnce);
    assert.strictEqual(h.removeFilter, Filter.prototype.removeFilter);
    assert.strictEqual(h.removeAllFilters, Filter.prototype.removeAllFilters);
    assert.strictEqual(h.filters, Filter.prototype.filters);
  });

});
