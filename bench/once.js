/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var hubjs = require('../lib/hub');


exports.compare = {

  'once()': function () {
    var hub = hubjs();
    hub.once('test', function () {});
  },

  'once(a, b, c)': function () {
    var hub = hubjs();
    hub.once('test', function (a, b, c) {});
  }

};

bench.runMain();
