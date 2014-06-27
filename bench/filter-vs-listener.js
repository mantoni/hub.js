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


function filter(next, callback) { next(callback); }
function listener1() { return; }
function listener2() { return; }

exports.compare = {

  'addFilter': function () {
    hub.addFilter('test', filter);
    hub.addListener('test', listener1);
    hub.emit('test');
    hub.removeListener('test', listener1);
    hub.removeFilter('test', filter);
  },

  'addListener': function () {
    hub.addListener('test', listener1);
    hub.addListener('test', listener2);
    hub.emit('test');
    hub.removeListener('test', listener1);
    hub.removeListener('test', listener2);
  }

};

bench.runMain();
