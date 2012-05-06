var CallbackManager = require('./callback-manager');
var ErrorList       = require('./error-list');
var strategy        = require('./strategy');


function matcher(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[a-z\.]+').replace(/\*/g, '[a-z]+') + '$');
}


function Hub() {
  this.listeners  = {};
  this.matchers   = [];
}


Hub.prototype.on = function (event, fn) {
  if (event.indexOf('*') === -1) {
    var entry = this.listeners[event];
    if (!entry) {
      this.listeners[event] = [fn];
    } else {
      entry.push(fn);
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


function emit(listeners, event, args, values, callback) {
  var callbackManager,
    errList,
    index = values.length,
    i, l = listeners.length;
  for (i = 0; i < l; i++) {
    var listener = listeners[i];
    var expectsCallback = listener.length > args.length;
    if (expectsCallback) {
      if (!callbackManager) {
        callbackManager = new CallbackManager(callback, values);
        callback        = null;
      }
      args[listener.length - 1] = callbackManager.createCallback(index);
    }
    var value;
    try {
      value = listener.apply(null, args);
    } catch (e) {
      if (!errList) {
        errList = [e];
      } else {
        errList.push(e);
      }
    }
    if (expectsCallback) {
      args.pop();
    } else {
      values[index] = value;
    }
    index++;
  }

  if (callbackManager) {
    callbackManager.resolveable(errList);
  } else {
    var err = errList || null;
    if (err) {
      err = err.length === 1 ? err[0] : new ErrorList(err);
    }
    callback(err, values);
  }
}


function handleError(err, callback) {
  if (!callback) {
    throw err;
  }
  callback(err);
}

function emitter(listeners, event, args, values, callback, strategyFn) {
  if (listeners) {
    emit(listeners, event, args, values, function (err, values) {
      if (err) {
        handleError(err, callback);
      } else if (callback) {
        callback(null, strategyFn(values));
      }
    });
  } else if (callback) {
    callback(null, strategyFn(values));
  }
}


Hub.prototype.emit = function (event) {
  var args      = Array.prototype.slice.call(arguments, 1),
    values      = [],
    listeners   = this.listeners[event],
    strategyFn  = strategy.LAST,
    matchers,
    callback;

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
    emit(matchers, event, args, values, function (err, values) {
      if (err) {
        handleError(err, callback);
      } else {
        emitter(listeners, event, args, values, callback, strategyFn);
      }
    });
  } else {
    emitter(listeners, event, args, values, callback, strategyFn);
  }
};

var hub = function () {
  return new Hub();
};

hub.Hub         = Hub;
hub.ErrorList   = ErrorList;
hub.LAST        = strategy.LAST;
hub.CONCAT      = strategy.CONCAT;

module.exports  = hub;
