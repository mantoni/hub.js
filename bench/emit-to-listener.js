/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var Hub   = require('../lib/hub').Hub;

var hub = new Hub();
hub.addListener('test.one', function () { return; });
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
