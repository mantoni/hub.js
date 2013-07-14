/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


function emit(listeners, scope, callback) {
  var listener = listen(),
    fns        = listeners.slice(),
    args       = scope.args,
    argsLength = args.length,
    l          = listeners.length,
    i;
  scope.callback = listener;

  for (i = 0; i < l; i++) {
    var fn    = fns[i];
    var async = fn.length > argsLength;
    if (async) {
      args[fn.length - 1] = listener();
    }
    var value;
    try {
      value = fn.apply(scope, args);
    } catch (e) {
      if (async) {
        args[fn.length - 1](e);
      } else {
        listener.err(e);
      }
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

function eventRE(event, generic) {
  var regexp = '^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+');
  if (generic) {
    regexp = regexp.replace(/([a-zA-Z_0-9\-\:]+)/g, '($1|\\*|\\*\\*)');
  }
  return new RegExp(regexp.replace(/%/g, 'a-zA-Z_0-9\\-\\:\\*') + '$');
}

function throwError(err) {
  if (err) {
    throw err;
  }
}

function remove(array, fn) {
  var i, l = array.length;
  for (i = 0; i < l; i++) {
    var a = array[i];
    if (a === fn || a.fn === fn) {
      array.splice(i, 1);
      return;
    }
  }
}

function combinedErrors(e1, e2) {
  return e1 ? new listen.ErrorList([e1, e2]) : e2;
}

function clearMatchingKeys(object, re) {
  var key;
  for (key in object) {
    if (object.hasOwnProperty(key) && re.test(key)) {
      delete object[key];
    }
  }
}

function cachedEntries(cache, type, event, re, each) {
  if (!cache.hasOwnProperty(event)) {
    var cached;
    each(event, re, function (entry) {
      cached = cached ? { on : cached.on.concat(entry.on) } : entry;
    });
    cache[event] = cached || {};
  }
  return cache[event][type];
}

function processResult(err, values, scope, callback) {
  if (callback) {
    if (err) {
      callback.call(scope, err);
    } else {
      if (scope.allResults) {
        callback.call(scope, null, values || []);
      } else {
        var value = values ? values[values.length - 1] : undefined;
        callback.call(scope, null, value);
      }
    }
  } else if (err) {
    var fns = scope.hub.listeners('error');
    if (!fns.length) {
      throw err;
    }
    scope.args = [err];
    emit(fns, scope, throwError);
  }
}

function chain(filter, next) {
  return function (scope, re, callback) {
    filter.call(scope, function (cb) {
      if (typeof cb !== 'function') {
        callback(new TypeError('No callback passed to next'));
      } else {
        next(scope, re, cb);
      }
    }, callback);
  };
}

var arrayPush = Array.prototype.push;

function hub() {
  var listeners      = {};
  var matchers       = [];
  var listenersCache = {};
  var matchersCache  = {};

  function listener(event) {
    var entry = listeners[event];
    if (entry) {
      return entry;
    }
    return (listeners[event] = { on : [], f : [] });
  }

  function matcherIndex(event) {
    var i;
    for (i = matchers.length - 1; i >= 0; i--) {
      if (matchers[i].event === event) {
        return i;
      }
    }
    return -1;
  }

  function matcher(event) {
    var i = matcherIndex(event);
    if (i !== -1) {
      return matchers[i];
    }
    var cmp = event.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                    .replace(/\./g, '1')
                    .replace(/\*/g, '2');
    var entry = {
      event : event,
      cmp   : cmp,
      re    : eventRE(event),
      on    : []
    };
    var l = matchers.length;
    for (i = 0; i < l; i++) {
      if (cmp > matchers[i].cmp) {
        matchers.splice(i, 0, entry);
        return entry;
      }
    }
    matchers.push(entry);
    return entry;
  }

  function eachListener(event, re, fn) {
    var evt;
    for (evt in listeners) {
      if (listeners.hasOwnProperty(evt) && re.test(evt)) {
        fn(listeners[evt]);
      }
    }
  }

  function eachMatcher(event, re, fn) {
    var i, l = matchers.length;
    for (i = 0; i < l; i++) {
      var matcher = matchers[i];
      if (matcher.re.test(event) || (re && re.test(matcher.event))) {
        fn(matcher);
      }
    }
  }

  function findListeners(type, event, re) {
    if (re) {
      return cachedEntries(listenersCache, type, event, re, eachListener);
    }
    var entry = listeners[event];
    return entry && entry[type];
  }

  function findMatchers(type, event, re) {
    return cachedEntries(matchersCache, type, event, re, eachMatcher);
  }

  function emitListeners(scope, re, callback) {
    var matchers  = findMatchers('on', scope.event, re);
    var listeners = findListeners('on', scope.event, re);
    var fns = matchers && listeners ? matchers.concat(listeners) :
        (matchers || listeners);
    if (!fns) {
      callback();
    } else {
      emit(fns, scope, callback);
    }
  }

  var addListener = function (event, fn) {
    this.emit('newListener', event, fn, function () {
      var re = eventRE(event, true);
      if (event.indexOf('*') === -1) {
        clearMatchingKeys(listenersCache, re);
        listener(event).on.push(fn);
      } else {
        clearMatchingKeys(matchersCache, re);
        matcher(event).on.push(fn);
      }
    });
  };

  var vars = 'a,b,c,d,e,f,g,h,i,j,k,l';

  return {

    on: addListener,
    addListener: addListener,

    addFilter: function (event, fn) {
      listener(event).f.push(fn);
    },

    removeFilter: function (event, fn) {
      remove(listener(event).f, fn);
    },

    once: function (event, fn) {
      var hub = this, proxy;
      if (fn.length) {
        /*jslint evil:true*/
        eval('proxy = (function (' + vars.substring(0, fn.length * 2 - 1) +
          ') { hub.removeListener(event, proxy);' +
          'return fn.apply(this, arguments); });');
      } else {
        proxy = function () {
          hub.removeListener(event, proxy);
          return fn.apply(this, arguments);
        };
      }
      proxy.fn = fn;
      this.on(event, proxy);
    },

    removeListener: function (event, fn) {
      this.emit('removeListener', event, fn, function () {
        var entry, re = eventRE(event, true);
        if (event.indexOf('*') === -1) {
          clearMatchingKeys(listenersCache, re);
          entry = listener(event);
        } else {
          clearMatchingKeys(matchersCache, re);
          entry = matcher(event);
        }
        remove(entry.on, fn);
      });
    },

    removeAllListeners: function (event) {
      if (arguments.length) {
        var re = eventRE(event, true);
        if (event.indexOf('*') === -1) {
          delete listeners[event];
          clearMatchingKeys(listenersCache, re);
        } else {
          var i = matcherIndex(event);
          if (i !== -1) {
            matchers.splice(i, 1);
          }
          clearMatchingKeys(matchersCache, re);
        }
      } else {
        listeners      = {};
        matchers       = [];
        listenersCache = {};
        matchersCache  = {};
      }
    },

    removeAllMatching: function (event, generic) {
      if (typeof generic === 'undefined') {
        generic = true;
      }
      var re = eventRE(event, generic), evt, i;
      clearMatchingKeys(listeners, re);
      for (i = matchers.length - 1; i >= 0; i--) {
        if (re.test(matchers[i].event)) {
          matchers.splice(i, 1);
        }
      }
      clearMatchingKeys(listenersCache, re);
      clearMatchingKeys(matchersCache, re);
    },

    listeners: function (event) {
      var entry;
      if (event.indexOf('*') === -1) {
        entry = listeners[event];
        if (!entry) {
          return [];
        }
      } else {
        entry = matcher(event);
      }
      return entry.on;
    },

    listenersMatching: function (event) {
      var matches = [], re = eventRE(event, true);
      eachListener(event, re, function (entry) {
        arrayPush.apply(matches, entry.on);
      });
      eachMatcher(event, re, function (entry) {
        arrayPush.apply(matches, entry.on);
      });
      return matches;
    },

    emit: function (event) {
      var callback, re,
        args = Array.prototype.slice.call(arguments, 1),
        scope = {
          hub        : this,
          event      : event,
          args       : args,
          allResults : false
        };

      if (typeof event === 'object') {
        scope.event      = event.event;
        scope.allResults = Boolean(event.allResults);
      }
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }
      if (scope.event.indexOf('*') !== -1) {
        re = eventRE(scope.event, true);
      }

      var filters = findListeners('f', scope.event, re);
      var fn      = emitListeners;
      if (filters && filters.length) {
        var i;
        for (i = filters.length - 1; i >= 0; i--) {
          fn = chain(filters[i], fn);
        }
      }

      fn(scope, re, function (err, values) {
        processResult(err, values, scope, callback);
      });
    }

  };
}

hub.listen = listen;

module.exports = hub;
