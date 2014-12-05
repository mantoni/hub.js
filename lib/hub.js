/*
 * hub.js
 *
 * Copyright (c) 2012-2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var inherits     = require('inherits');
var Filter       = require('glob-filter').Filter;
var AsyncEmitter = require('async-glob-events').AsyncEmitter;


function defaultCallback(err) {
  if (err) {
    throw err;
  }
}


function Hub() {
  AsyncEmitter.call(this);
  Filter.call(this, { reverse : true });
}

inherits(Hub, AsyncEmitter);

var emit   = Filter.prototype.emit;
var invoke = AsyncEmitter.prototype.invoke;

Hub.prototype.invoke = function (iterator, scope, callback) {
  emit.call(this, scope, function (cb) {
    invoke.call(this, iterator, scope, cb);
  }, callback || defaultCallback);
};

Object.keys(Filter.prototype).forEach(function (key) {
  if (key !== 'emit') {
    Hub.prototype[key] = Filter.prototype[key];
  }
});

Hub.prototype.removeAll = function (event) {
  this.removeAllFilters(event);
  this.removeAllListeners(event);
};


exports.Hub = Hub;
