/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var hub   = require('../lib/hub').create();


hub.addFilter('test.one', function (next, callback) { next(callback); });
hub.addListener('test.one', function () { return; });


exports.compare = {

  'emit(test.one)': function () {
    hub.emit('test.one');
  },

  'emit(test.*)': function () {
    hub.emit('test.*');
  },

  'emit(**)': function () {
    hub.emit('**');
  }

};

bench.runMain();
