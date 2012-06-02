/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var emit      = require('./emit');
var strategy  = require('./strategy');


function eventRE(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+').
    replace(/%/g, 'a-z\\*') + '$');
}


function Hub() {
  this.listeners  = {};
  this.matchers   = [];
}


Hub.prototype.on = function (event, fn) {
  if (event.indexOf('*') === -1) {
    var entry = this.listeners[event];
    if (entry) {
      entry.push(fn);
    } else {
      this.listeners[event] = [fn];
    }
  } else {
    var cmp = event.replace(/[^\.\*]+/g, '0')
                    .replace(/\./g, '1')
                    .replace(/\*/g, '2');
    var entry = {
      event : event,
      re    : eventRE(event),
      fn    : fn,
      cmp   : cmp
    };
    var i, l = this.matchers.length;
    if (l) {
      for (i = 0; i < l; i++) {
        if (cmp > this.matchers[i].cmp) {
          this.matchers.splice(i, 0, entry);
          return;
        }
      }
    }
    this.matchers.push(entry);
  }
};


Hub.prototype.un = function (event, fn) {
  var i, l;
  if (event.indexOf('*') === -1) {
    if (fn) {
      var entry = this.listeners[event];
      if (entry) {
        for (i = 0, l = entry.length; i < l; i++) {
          if (entry[i] === fn) {
            entry.splice(i, 1);
            break;
          }
        }
      }
    } else {
      delete this.listeners[event];
    }
  } else {
    for (i = this.matchers.length - 1; i >= 0 ; i--) {
      var matcher = this.matchers[i];
      if (matcher.event === event && (!fn || fn === matcher.fn)) {
        this.matchers.splice(i, 1);
      }
    }
  }
};


Hub.prototype.once = function (event, fn) {
  var self = this;
  var once = function () {
    self.un(event, once);
    self.un(event, fn);
  };
  this.on(event, fn);
  this.on(event, once);
};


Hub.prototype.emit = function (event) {
  var args        = Array.prototype.slice.call(arguments, 1),
    strategyFn    = strategy.LAST,
    broadcast     = event.indexOf('*') !== -1,
    listeners,
    matchers,
    callback,
    re, i, l;

  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
    if (typeof args[args.length - 1] === 'function') {
      strategyFn = args.pop();
    }
  }

  if (broadcast) {
    re = eventRE(event);
    listeners = [];
    var evt;
    for (evt in this.listeners) {
      if (this.listeners.hasOwnProperty(evt) && re.test(evt)) {
        listeners.push.apply(listeners, this.listeners[evt]);
      }
    }
  } else {
    listeners = this.listeners[event];
  }

  for (i = 0, l = this.matchers.length; i < l; i++) {
    var matcher = this.matchers[i];
    if (matcher.re.test(event) || (re && re.test(matcher.event))) {
      if (!matchers) {
        matchers = [];
      }
      matchers.push(matcher.fn);
    }
  }

  if (matchers) {
    emit.matchers(event, matchers, listeners, args, strategyFn, callback);
  } else {
    emit.listeners(listeners, args, [], strategyFn, callback);
  }
};

var hub = function (listeners) {
  var instance = new Hub();
  if (listeners) {
    for (var event in listeners) {
      var listener = listeners[event];
      if (typeof listener === 'function') {
        instance.on(event, listener);
      }
    }
  }
  return instance;
};

hub.Hub         = Hub;
hub.LAST        = strategy.LAST;
hub.CONCAT      = strategy.CONCAT;

module.exports  = hub;
