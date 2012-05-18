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


function matcher(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[a-z\.]+').replace(/\*/g, '[a-z]+') + '$');
}


function assertFunction(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Function expected: ' + fn);
  }
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
    this.matchers.push({
      event : event,
      re    : matcher(event),
      fn    : fn
    });
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


function handleError(callback, err) {
  if (!callback) {
    throw err;
  }
  callback(err);
}

function invoke(callbacks, err, result) {
  for (var i = 0, l = callbacks.length; i < l; i++) {
    callbacks[i](err, result);
  }
}

function emitAndMerge(listeners, args, values, strategyFn, callback) {
  if (listeners) {
    emit(listeners, null, args, values, function (err, values) {
      if (err) {
        handleError(callback, err);
      } else if (callback) {
        callback(null, strategyFn(values));
      }
    });
  } else if (callback) {
    callback(null, strategyFn(values));
  }
}


Hub.prototype.emit = function (event) {
  var args        = Array.prototype.slice.call(arguments, 1),
    values        = [],
    listeners     = this.listeners[event],
    strategyFn    = strategy.LAST,
    matchers,
    callback,
    beforeReturn,
    afterReturn;

  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
    if (typeof args[args.length - 1] === 'function') {
      strategyFn = args.pop();
    }
  }

  for (var i = 0, l = this.matchers.length; i < l; i++) {
    var matcher = this.matchers[i];
    if (matcher.re.test(event)) {
      if (!matchers) {
        matchers = [];
      }
      matchers.push(matcher.fn);
    }
  }

  if (matchers) {

    var stopped     = false;
    var scope       = {
      event         : event,
      stop          : function () {
        stopped = true;
      },
      beforeReturn  : function (fn) {
        assertFunction(fn);
        if (!beforeReturn) {
          beforeReturn = [];
        }
        beforeReturn.push(fn);
      },
      afterReturn   : function (fn) {
        assertFunction(fn);
        if (!afterReturn) {
          afterReturn = [];
        }
        afterReturn.push(fn);
      }
    };

    var onReturn = function (err, result) {
      if (beforeReturn) {
        invoke(beforeReturn, err, result);
      }
      if (callback) {
        callback(err, result);
      }
      if (afterReturn) {
        invoke(afterReturn, err, result);
      }
      if (!callback && err) {
        throw err;
      }
    };

    emit(matchers, scope, args, values, function (err, values) {
      if (err) {
        handleError(callback, err);
      } else if (!stopped) {
        emitAndMerge(listeners, args, values, strategyFn, onReturn);
      }
    });

  } else {

    emitAndMerge(listeners, args, values, strategyFn, callback);

  }
};

var hub = function () {
  return new Hub();
};

hub.Hub         = Hub;
hub.LAST        = strategy.LAST;
hub.CONCAT      = strategy.CONCAT;

module.exports  = hub;
