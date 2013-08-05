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

  'concat': function () {
    var a = ['a', 'b', 'c'];
    a = a.concat(['x', 'y', 'z']);
  },

  'push.apply': function () {
    var a = ['a', 'b', 'c'];
    a.push.apply(a, ['x', 'y', 'z']);
  }

};

bench.runMain();
