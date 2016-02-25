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


function Hub() {
  AsyncEmitter.call(this, OPTS_EVENTS);
  Filter.call(this, {
    reverse: true,
    addEvent: 'newFilter',
    removeEvent: 'removeFilter',
    internalEmitter: this,
    internalEvents: ['newListener', 'removeListener']
  });
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
  var hub = this;
  filter.call(this, scope, function (cb) {
    invoke.call(hub, iterator, scope, cb);
  }, callback || function (err) {
    if (err) {
      if (scope.event === 'error') {
        throw err;
      }
      hub.emitError(err, {
        event: scope.event,
        args: scope.args,
        scope: scope
      });
    }
  });
};

Hub.prototype.removeAll = function (event) {
  this.removeAllFilters(event);
  this.removeAllListeners(event);
};


exports.Hub = Hub;
