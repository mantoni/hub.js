/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


module.exports = function emit(fns, scope, args, values, callback) {
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
};
