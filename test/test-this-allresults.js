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


test('this.allResults', {

  before: function () {
    this.hub = hub();
  },

  'is false by default': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit('test');

    assert.strictEqual(allResults, false);
  },

  'is false if not configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test' });

    assert.strictEqual(allResults, false);
  },

  'is false if configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test', allResults : false });

    assert.strictEqual(allResults, false);
  },

  'is true if configured': function () {
    var allResults;

    this.hub.on('test', function () {
      allResults = this.allResults;
    });
    this.hub.emit({ event : 'test', allResults : true });

    assert.strictEqual(allResults, true);
  }

});
