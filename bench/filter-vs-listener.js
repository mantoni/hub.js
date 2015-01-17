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

function filter(next, callback) { next(callback); }
function listener1() { return; }
function listener2() { return; }

exports.compare = {

  'filter': function () {
    hub.addFilter('test', filter);
    hub.addListener('test', listener1);
    hub.emit('test');
    hub.removeListener('test', listener1);
    hub.removeFilter('test', filter);
  },

  'listener': function () {
    hub.addListener('test', listener1);
    hub.addListener('test', listener2);
    hub.emit('test');
    hub.removeListener('test', listener1);
    hub.removeListener('test', listener2);
  }

};

bench.runMain();
