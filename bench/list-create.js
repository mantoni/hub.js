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

exports.compare = {

  'list': function () {
    return list();
  },

  'array': function () {
    return [];
  }

};

bench.runMain();
