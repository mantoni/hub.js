/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var inherits     = require('inherits');
var Filter       = require('glob-filter').Filter;
var AsyncEmitter = require('async-glob-events').AsyncEmitter;


var OPTS_EVENTS = {
  internalEvents: ['newFilter', 'removeFilter']
};
var OPTS_FILTER = {
  reverse: true,
  internalEvents: ['newListener', 'removeListener']
};

function defaultCallback(err) {
  if (err) {
    throw err;
  }
}

function filterEvent(emitter, event) {
  emitter.addFilter(event, function () {
    if (this.emitter !== emitter) {
      emitter.emit(event, this.args[0], this.args[1]);
    }
  });
}

function Hub() {
  AsyncEmitter.call(this, OPTS_EVENTS);
  Filter.call(this, OPTS_FILTER);
  filterEvent(this, 'removeFilter');
  filterEvent(this, 'newFilter');
}

inherits(Hub, AsyncEmitter);

Object.keys(Filter.prototype).forEach(function (key) {
  if (key !== 'emit') {
    Hub.prototype[key] = Filter.prototype[key];
  }
});

var filter = Filter.prototype.emit;
var invoke = AsyncEmitter.prototype.invoke;

Hub.prototype.invoke = function (iterator, scope, callback) {
  filter.call(this, scope, function (cb) {
    invoke.call(this, iterator, scope, cb);
  }, callback || defaultCallback);
};

Hub.prototype.removeAll = function (event) {
  this.removeAllFilters(event);
  this.removeAllListeners(event);
};


exports.Hub = Hub;
