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


function noop() { return; }

function emitFn(emit, self) {
  return function (cb) {
    var a = [this.event].concat(this.args);
    a.push(cb);
    emit.apply(self, a);
  };
}


function Hub() {
  AsyncEmitter.call(this);
  Filter.call(this);
  this._emit = emitFn(AsyncEmitter.prototype.emit, this);
}

inherits(Hub, AsyncEmitter);

Hub.prototype.emit = function (event) {
  var l = arguments.length;
  if (l > 1) {
    var a = [event], i, callback;
    for (i = 1; i < l; i++) {
      a[i] = arguments[i];
    }
    callback = typeof a[l - 1] === 'function'
      ? a.pop()
      : noop;
    a.push(this._emit, callback);
    Filter.prototype.emit.apply(this, a);
  } else {
    Filter.prototype.emit.call(this, event, this._emit, noop);
  }
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
