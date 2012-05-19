/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


function emit(fns, scope, args, values, callback) {
  var listener = listen(values);
  for (var i = 0, l = fns.length; i < l; i++) {
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
    if (async) {
      args.pop();
    } else if (value !== undefined) {
      listener.push(value);
    }
  }
  listener.then(callback);
}


function assertFunction(fn) {
  if (typeof fn !== 'function') {
    throw new TypeError('Function expected: ' + fn);
  }
}


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


exports.listeners = function (listeners, args, values, strategyFn, callback) {
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
};


exports.matchers = function (event, matchers, listeners, args, strategyFn,
                              callback) {
  var values  = [],
    stopped   = false,
    beforeReturn,
    afterReturn;

  var scope = {
    event: event,
    stop: function () {
      stopped = true;
    },
    beforeReturn: function (fn) {
      assertFunction(fn);
      if (!beforeReturn) {
        beforeReturn = [];
      }
      beforeReturn.push(fn);
    },
    afterReturn: function (fn) {
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
      exports.listeners(listeners, args, values, strategyFn, onReturn);
    }
  });
};
