/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var bench = require('bench');
var list  = require('../lib/list');

var times = 50;

exports.compare = {

  'list.push': function () {
    var l = list();
    var i;
    for (i = 0; i < times; i++) {
      l.push(i);
    }
  },

  'array.push': function () {
    var a = [];
    var i;
    for (i = 0; i < times; i++) {
      a.push(i);
    }
  }

};

bench.runMain();
