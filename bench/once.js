/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var hubjs = require('../lib/hub');


exports.compare = {

  'once()': function () {
    var hub = hubjs.create();
    hub.once('test', function () { return; });
  },

  'once(a, b, c)': function () {
    var hub = hubjs.create();
    hub.once('test', function (a, b, c) {
      /*jslint unparam: true*/
      return;
    });
  }

};

bench.runMain();
