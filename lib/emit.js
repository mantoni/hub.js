/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


function emit(fns, scope, args, callback) {
  var listener = scope.callback;
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
    var scope = {
      callback: listen(values)
    };
    emit(listeners, scope, args, function (err, values) {
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
    },
    callback: listen(values)
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

  emit(matchers, scope, args, function (err, values) {
    if (err) {
      handleError(callback, err);
    } else if (!stopped) {
      exports.listeners(listeners, args, values, strategyFn, onReturn);
    }
  });
};
