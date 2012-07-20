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
  var errList, i, l = callbacks.length;
  for (i = 0; i < l; i++) {
    try {
      callbacks[i](err, result);
    } catch (e) {
      if (!errList) {
        errList = [];
      }
      errList.push(e);
    }
  }
  if (errList) {
    if (err) {
      errList.push(err);
    } else if (errList.length === 1) {
      throw errList[0];
    }
    throw new listen.ErrorList(errList);
  }
}


exports.listeners = function (listeners, args, values, strategyFn, callback) {
  if (listeners) {
    var listener  = listen(values);
    var scope     = { callback : listener };
    emit(listeners.slice(), scope, args);
    listener.then(function (err, values) {
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


exports.matchers = function (hub, event, matchers, listeners, args,
                              strategyFn, callback) {
  var listener  = listen(),
    stopped     = false,
    beforeReturn,
    afterReturn;

  var scope = {
    hub   : hub,
    event : event,
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
    callback: listener
  };

  var onReturn = function (err, result) {
    if (beforeReturn) {
      try {
        invoke(beforeReturn, err, result);
      } catch (e) {
        err = e;
      }
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

  emit(matchers, scope, args);
  listener.then(function (err, values) {
    if (err) {
      handleError(callback, err);
    } else if (!stopped) {
      exports.listeners(listeners, args, values, strategyFn, onReturn);
    }
  });
};
