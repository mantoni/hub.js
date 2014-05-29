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

var noop = function () { return; };

function Hub() {
  AsyncEmitter.call(this);
  Filter.call(this);
}

inherits(Hub, AsyncEmitter);

Hub.prototype.emit = function (event) {
  var l = arguments.length - 1;
  var callback = l > 0 && typeof arguments[l] === 'function'
    ? arguments[l]
    : noop;
  var self = this;
  Filter.prototype.emit.call(this, event, function (cb) {
    AsyncEmitter.prototype.emit.call(self, event, cb);
  }, callback);
};

Object.keys(Filter.prototype).forEach(function (key) {
  if (key !== 'emit') {
    Hub.prototype[key] = Filter.prototype[key];
  }
});


exports.Hub = Hub;

exports.create = function () {
  return new Hub();
};
