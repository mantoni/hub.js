/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var hub   = require('../lib/hub')();


hub.addListener('test.one', function () {});
hub.addListener('test.one', function () {});


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
