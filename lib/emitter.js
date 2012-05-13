var CallbackManager = require('./callback-manager');
var util            = require('./util');


function emit(listeners, args, returnValues, callback) {
  var index = returnValues.length,
    callbackManager,
    errList;
  for (var i = 0, l = listeners.length; i < l; i++) {
    var listener        = listeners[i];
    var expectsCallback = listener.length > args.length;
    if (expectsCallback) {
      if (!callbackManager) {
        callbackManager = new CallbackManager(callback, returnValues);
        callback        = null;
      }
      args[listener.length - 1] = callbackManager.createCallback(index);
    }
    var returnValue;
    try {
      returnValue = listener.apply(null, args);
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
      returnValues[index] = returnValue;
    }
    index++;
  }

  if (callbackManager) {
    callbackManager.resolveable(errList);
  } else {
    util.invokeCallback(callback, returnValues, errList);
  }
}

module.exports = emit;
