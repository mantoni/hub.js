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

function clearAll(map) {
  var key;
  for (key in map) {
    if (map.hasOwnProperty(key)) {
      delete map[key];
    }
  }
}

function clearMatchingKeys(object, re) {
  var key;
  for (key in object) {
    if (object.hasOwnProperty(key) && re.test(key)) {
      delete object[key];
    }
  }
}

function matchingListeners(arr, event, re, each) {
  var matched;
  each(arr, event, re, function (entry) {
    matched = matched ? matched.concat(entry) : entry;
  });
  return matched;
}

function matchingWildcardListeners(arr, event, re, each) {
  var matched;
  each(arr, event, re, function (entry) {
    matched = matched ? matched.concat(entry.on) : entry.on;
  });
  return matched;
}

function eachListener(arr, event, re, fn) {
  var evt;
  for (evt in arr) {
    if (arr.hasOwnProperty(evt) && re.test(evt)) {
      fn(arr[evt]);
    }
  }
}

function eachMatcher(arr, event, re, fn) {
  var i, l = arr.length;
  for (i = 0; i < l; i++) {
    var entry = arr[i];
    if (entry.re.test(event) || (re && re.test(entry.event))) {
      fn(entry);
    }
  }
}

function find(matchers, listeners, event, re) {
  var m = matchingWildcardListeners(matchers, event, re, eachMatcher);
  var l = re ? matchingListeners(listeners, event, re, eachListener) :
      listeners[event];
  return m && l ? m.concat(l) : (m || l || []);
}

function matcherIndex(arr, event) {
  var i;
  for (i = arr.length - 1; i >= 0; i--) {
    if (arr[i].event === event) {
      return i;
    }
  }
  return -1;
}

function matcher(arr, event) {
  // TODO speed up matcher lookup with an event->entry map
  var i = matcherIndex(arr, event);
  if (i !== -1) {
    return arr[i];
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
  var l = arr.length;
  for (i = 0; i < l; i++) {
    if (cmp > arr[i].cmp) {
      arr.splice(i, 0, entry);
      return entry;
    }
  }
  arr.push(entry);
  return entry;
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

function createAdd(newEvent, list, wildcardList, cache) {
  return function (event, fn) {
    this.emit(newEvent, event, fn, function () {
      var re = eventRE(event, true);
      clearMatchingKeys(cache, re);
      if (event.indexOf('*') === -1) {
        var arr = list[event];
        if (arr) {
          arr.push(fn);
        } else {
          list[event] = [fn];
        }
      } else {
        matcher(wildcardList, event).on.push(fn);
      }
    });
  };
}

function createRemove(removeEvent, list, wildcardList, cache) {
  return function (event, fn) {
    this.emit(removeEvent, event, fn, function () {
      clearMatchingKeys(cache, eventRE(event, true));
      var entry;
      if (event.indexOf('*') === -1) {
        entry = list[event];
      } else {
        var index = matcherIndex(wildcardList, event);
        if (index !== -1) {
          entry = wildcardList[index].on;
        }
      }
      if (entry) {
        var i, l = entry.length;
        for (i = 0; i < l; i++) {
          var a = entry[i];
          if (a === fn || a.fn === fn) {
            entry.splice(i, 1);
            return;
          }
        }
      }
    });
  };
}

var arrayPush = Array.prototype.push;

function hub() {
  var listeners         = {};
  var filters           = {};
  var wildcardListeners = [];
  var wildcardFilters   = [];
  var filtersCache      = {};
  var listenersCache    = {};

  function emitListeners(scope, re, callback) {
    var evt = scope.event;
    var fns = listenersCache[evt];
    if (!fns) {
      fns = listenersCache[evt] = find(wildcardListeners, listeners, evt, re);
    }
    if (fns && fns.length) {
      emit(fns, scope, callback);
    } else {
      callback();
    }
  }

  var addListener = createAdd('newListener', listeners, wildcardListeners,
      listenersCache);
  var vars = 'a,b,c,d,e,f,g,h,i,j,k,l';

  return {

    on: addListener,
    addListener: addListener,

    addFilter: createAdd('newFilter', filters, wildcardFilters, filtersCache),

    removeFilter: createRemove('removeFilter', filters,
        wildcardFilters, filtersCache),

    removeListener: createRemove('removeListener', listeners,
        wildcardListeners, listenersCache),

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

    removeAllListeners: function (event) {
      if (arguments.length) {
        var re = eventRE(event, true);
        clearMatchingKeys(listenersCache, re);
        if (event.indexOf('*') === -1) {
          delete listeners[event];
        } else {
          var i = matcherIndex(wildcardListeners, event);
          if (i !== -1) {
            wildcardListeners.splice(i, 1);
          }
        }
      } else {
        wildcardListeners.length = 0;
        clearAll(listeners);
        clearAll(listenersCache);
      }
    },

    //removeAllFilters

    removeAllMatching: function (event, generic) {
      if (typeof generic === 'undefined') {
        generic = true;
      }
      var re = eventRE(event, generic), evt, i;
      clearMatchingKeys(listeners, re);
      for (i = wildcardListeners.length - 1; i >= 0; i--) {
        if (re.test(wildcardListeners[i].event)) {
          wildcardListeners.splice(i, 1);
        }
      }
      clearMatchingKeys(listenersCache, re);
      clearMatchingKeys(filtersCache, re);
    },

    //removeAllMatchingListeners
    //removeAllMatchingFilters

    listeners: function (event) {
      var entry;
      if (event.indexOf('*') === -1) {
        entry = listeners[event];
        if (!entry) {
          return [];
        }
      } else {
        entry = matcher(wildcardListeners, event).on;
      }
      return entry;
    },

    //filters

    listenersMatching: function (event) {
      var matches = [], re = eventRE(event, true);
      eachMatcher(wildcardListeners, event, re, function (entry) {
        arrayPush.apply(matches, entry.on);
      });
      eachListener(listeners, event, re, function (entry) {
        arrayPush.apply(matches, entry);
      });
      return matches;
    },

    //filtersMatching

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
      var evt   = scope.event;
      var cache = filtersCache[evt];
      if (!cache) {
        if (evt.indexOf('*') !== -1) {
          re = eventRE(evt, true);
        }
        var fn  = emitListeners;
        var fns = find(wildcardFilters, filters, evt, re);
        if (fns && fns.length) {
          var i;
          for (i = fns.length - 1; i >= 0; i--) {
            fn = chain(fns[i], fn);
          }
        }
        cache = filtersCache[evt] = { fn : fn, re : re };
      }

      cache.fn(scope, cache.re, function (err, values) {
        processResult(err, values, scope, callback);
      });
    }

  };
}

hub.listen = listen;

module.exports = hub;
