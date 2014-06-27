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
    var a = this.args.slice();
    a.unshift(this);
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
  var scope;
  if (typeof event === 'object') {
    scope = event;
    event = scope.event;
  } else {
    scope = { event : event };
  }
  var l = arguments.length, callback;
  if (l > 1) {
    var a = [], i;
    for (i = 1; i < l; i++) {
      a[i - 1] = arguments[i];
    }
    scope.args = a;
    if (typeof a[l - 2] === 'function') {
      callback = a.pop();
    }
  }
  Filter.prototype.emit.call(this, scope, this._emit, callback || noop);
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
