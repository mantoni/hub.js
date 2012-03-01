var CallbackManager = require('./callback-manager');
var ErrorList       = require('./error-list');


function Hub() {
  this.listeners = {};
}

Hub.prototype.on = function (name, fn) {
  var entry = this.listeners[name];
  if (!entry) {
    this.listeners[name] = [fn];
  } else {
    entry.push(fn);
  }
};

Hub.prototype.emit = function (name) {
  var args      = Array.prototype.slice.call(arguments, 1);
  var callback  = typeof args[args.length - 1] === 'function' ?
                    args.pop() : null;
  var listeners = this.listeners[name];
  var errList;
  var value;
  var callbackManager;
  if (listeners) {
    var i, l = listeners.length;
    for (i = 0; i < l; i++) {
      var listener        = listeners[i];
      var expectsCallback = listener.length > args.length;
      if (expectsCallback) {
        if (!callbackManager) {
          callbackManager = new CallbackManager(callback);
          callback        = null;
        }
        args[listener.length - 1] = callbackManager.createCallback();
      }
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
      }
    }
  }
  if (callbackManager) {
    callbackManager.resolveable(errList);
  } else {
    var err = null;
    if (errList) {
      err = errList.length === 1 ? errList[0] : new ErrorList(errList);
    }
    if (callback) {
      callback(err, value);
    } else if (err) {
      throw err;
    }
  }
};

exports.create = function () {
  return new Hub();
};

exports.Hub = Hub;
