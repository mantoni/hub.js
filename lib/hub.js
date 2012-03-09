var CallbackManager = require('./callback-manager');
var ErrorList       = require('./error-list');
var strategy        = require('./strategy');


function Hub() {
  this.listeners = {};
}


Hub.prototype.on = function (event, fn) {
  var entry = this.listeners[event];
  if (!entry) {
    this.listeners[event] = [fn];
  } else {
    entry.push(fn);
  }
};


Hub.prototype.un = function (event, fn) {
  if (fn) {
    var entry = this.listeners[event];
    if (entry) {
      var i, l = entry.length;
      for (i = 0; i < l; i++) {
        if (entry[i] === fn) {
          entry.splice(i, 1);
          break;
        }
      }
    }
  } else {
    delete this.listeners[event];
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
  var args      = Array.prototype.slice.call(arguments, 1);
  var callback;
  if (typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }
  var listeners = this.listeners[event];
  var errList;
  var value;
  var merge;
  var callbackManager;
  if (listeners) {
    var al      = args.length;
    var values  = [];
    if (callback && al && typeof args[al - 1] === 'function') {
      merge = args.pop();
      al--;
    } else {
      merge = strategy.LAST;
    }
    var i, l = listeners.length;
    for (i = 0; i < l; i++) {
      var listener        = listeners[i];
      var expectsCallback = listener.length > al;
      if (expectsCallback) {
        if (!callbackManager) {
          callbackManager = new CallbackManager(callback, values, merge);
          callback        = null;
        }
        args[listener.length - 1] = callbackManager.createCallback(i);
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
      } else {
        values[i] = value;
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
      if (merge) {
        value = merge(values);
      }
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

exports.LAST = strategy.LAST;
