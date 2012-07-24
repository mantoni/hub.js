/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


function emit(fns, scope, args) {
  var listener = scope.callback, i, l = fns.length;
  for (i = 0; i < l; i++) {
    var fn    = fns[i];
    var async = fn.length > args.length;
    if (async) {
      args[fn.length - 1] = listener();
    }
    var value;
    try {
      value = fn.apply(scope, args);
    } catch (e) {
      listener.err(e);
    }
    if (value !== undefined) {
      if (async) {
        args.pop()(null, value);
      } else {
        listener.push(value);
      }
    } else if (async) {
      args.pop();
    }
  }
}

var DEFAULT_SCOPE = { stopped : function () { return false; } };

module.exports = function (hub, event, listeners, args, values, callback) {
  if (listeners) {
    var listener  = listen(values),
      stopped     = false,
      scope       = {
        hub       : hub,
        event     : event,
        stop      : function () { stopped = true; },
        stopped   : function () { return stopped; },
        callback  : listener
      };
    emit(listeners.slice(), scope, args);
    listener.then(function (err, values) {
      callback.call(scope, err, values);
    });
  } else {
    callback.call(DEFAULT_SCOPE, null, values);
  }
};
