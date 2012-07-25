/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen    = require('listen');


var DEFAULT_SCOPE     = { stopped : function () { return false; } };
var DEFAULT_STRATEGY  = function (arr) { return arr[arr.length - 1]; };

function emit(hub, event, listeners, args, values, callback) {
  if (listeners) {
    var listener  = listen(values),
      stopped     = false,
      scope       = {
        hub       : hub,
        event     : event,
        stop      : function () { stopped = true; },
        stopped   : function () { return stopped; },
        callback  : listener
      },
      fns         = listeners.slice(),
      l           = listeners.length,
      i;

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

    listener.then(function (err, values) {
      callback.call(scope, err, values);
    });
  } else {
    callback.call(DEFAULT_SCOPE, null, values);
  }
}


function eventRE(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+').
    replace(/%/g, 'a-z\\*') + '$');
}


function invoke(hub, event, fns, args, values, strategyFn, callback) {
  var listeners = fns.shift();
  emit(hub, event, listeners, args, values, function (err, values) {
    if (err) {
      callback.call(this, err);
    } else if (this.stopped() || !fns.length) {
      callback.call(this, null, strategyFn(values));
    } else {
      invoke(hub, event, fns, args, values, strategyFn, callback);
    }
  });
}


function done(callback, err, result) {
  if (callback) {
    callback(err, result);
  } else if (err) {
    throw err;
  }
}


function create() {
  var listeners = {};
  var matchers  = [];

  function entry(event) {
    var e = listeners[event];
    if (!e) {
      listeners[event] = e = { before : [], on : [], after : [] };
    }
    return e;
  }

  return {

    on : function (event, fn) {
      if (event.indexOf('*') === -1) {
        entry(event).on.push(fn);
      } else {
        var cmp = event.replace(/[a-z]+/g, '0')
                        .replace(/\./g, '1')
                        .replace(/\*/g, '2');
        var i, l, e = {
          event : event,
          re    : eventRE(event),
          fn    : fn,
          cmp   : cmp
        };
        for (i = 0, l = matchers.length; i < l; i++) {
          if (cmp > matchers[i].cmp) {
            matchers.splice(i, 0, e);
            return;
          }
        }
        matchers.push(e);
      }
    },

    before : function (event, fn) {
      entry(event).before.push(fn);
    },

    after : function (event, fn) {
      entry(event).after.push(fn);
    },

    un : function (event, fn) {
      var i, l;
      if (event.indexOf('*') === -1) {
        if (fn) {
          var entry = listeners[event];
          if (entry) {
            var on = entry.on;
            for (i = 0, l = on.length; i < l; i++) {
              if (on[i] === fn) {
                on.splice(i, 1);
                break;
              }
            }
          }
        } else {
          delete listeners[event];
        }
      } else {
        for (i = matchers.length - 1; i >= 0; i--) {
          var matcher = matchers[i];
          if (matcher.event === event && (!fn || fn === matcher.fn)) {
            matchers.splice(i, 1);
          }
        }
      }
    },

    once : function (event, fn) {
      var self = this;
      function once() {
        self.un(event, once);
        self.un(event, fn);
      }
      this.on(event, once);
      this.on(event, fn);
    },

    emit : function (event) {
      var args        = Array.prototype.slice.call(arguments, 1),
        strategyFn    = DEFAULT_STRATEGY,
        broadcast     = event.indexOf('*') !== -1,
        fns           = [],
        matcherFns,
        afterFns,
        callback,
        evt,
        re,
        i,
        l;

      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
        if (typeof args[args.length - 1] === 'function') {
          strategyFn = args.pop();
        }
      }

      if (broadcast) {
        re = eventRE(event);
        var onFns = [];
        for (evt in listeners) {
          if (listeners.hasOwnProperty(evt) && re.test(evt)) {
            onFns.push.apply(onFns, listeners[evt].on);
          }
        }
        fns.push(onFns);
      } else {
        var entry = listeners[event];
        if (entry) {
          fns.push(entry.before, entry.on);
          afterFns = entry.after;
        }
      }

      for (i = 0, l = matchers.length; i < l; i++) {
        var matcher = matchers[i];
        if (matcher.re.test(event) || (re && re.test(matcher.event))) {
          if (!matcherFns) {
            matcherFns = [];
          }
          matcherFns.push(matcher.fn);
        }
      }
      if (matcherFns) {
        fns.unshift(matcherFns);
      }

      invoke(this, event, fns, args, [], strategyFn, function (err, result) {
        if (this.stopped()) {
          done(callback, err, result);
        } else {
          emit(this.hub, event, afterFns, [err, result], [], function () {
            done(callback, err, result);
          });
        }
      });
    }

  };
}


var hub = function (listeners) {
  /*jslint forin: true*/
  var instance = create(), event;
  if (listeners) {
    for (event in listeners) {
      var listener = listeners[event];
      if (typeof listener === 'function') {
        instance.on(event, listener);
      }
    }
  }
  return instance;
};

hub.listen      = listen;
hub.LAST        = DEFAULT_STRATEGY;
hub.CONCAT      = function (arr) { return arr; };

module.exports  = hub;
