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
    matched = matched ? matched.concat(entry.fns) : entry.fns;
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

function chain(filter, next) {
  return function (scope, re, callback) {
    filter.call(scope, function (cb) {
      next(scope, re, cb || callback);
    }, callback);
  };
}

function buildChain(fns, fn) {
  if (fns && fns.length) {
    var i;
    for (i = fns.length - 1; i >= 0; i--) {
      fn = chain(fns[i], fn);
    }
  }
  return fn;
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
    var filters   = scope.hub.filters('error');
    var listeners = scope.hub.listeners('error');
    if (!filters.length && !listeners.length) {
      throw err;
    }
    buildChain(filters, function (scope, re, callback) {
      emit(listeners, scope, callback);
    })({
      event : 'error',
      args  : [err],
      cause : scope
    }, null, throwError);
  }
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
        // TODO speed up matcher lookup with an event->entry map
        var i = matcherIndex(wildcardList, event);
        if (i === -1) {
          var cmp = event.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                          .replace(/\./g, '1')
                          .replace(/\*/g, '2');
          var entry = {
            event : event,
            cmp   : cmp,
            re    : eventRE(event),
            fns   : [fn]
          };
          var l = wildcardList.length;
          for (i = 0; i < l; i++) {
            if (cmp > wildcardList[i].cmp) {
              wildcardList.splice(i, 0, entry);
              return;
            }
          }
          wildcardList.push(entry);
        } else {
          wildcardList[i].fns.push(fn);
        }
      }
    });
  };
}

function removeFromEntry(entry, fn) {
  var i, l = entry.length;
  for (i = 0; i < l; i++) {
    var a = entry[i];
    if (a === fn || a.fn === fn) {
      entry.splice(i, 1);
      return l - 1;
    }
  }
  return l;
}

function createRemove(removeEvent, list, wildcardList, cache) {
  return function (event, fn) {
    this.emit(removeEvent, event, fn, function () {
      clearMatchingKeys(cache, eventRE(event, true));
      if (event.indexOf('*') === -1) {
        if (list[event] && !removeFromEntry(list[event], fn)) {
          delete list[event];
        }
      } else {
        var index = matcherIndex(wildcardList, event);
        if (index !== -1 && !removeFromEntry(wildcardList[index].fns, fn)) {
          wildcardList.splice(index, 1);
        }
      }
    });
  };
}

function createRemoveAll(list, wildcardList, cache) {
  return function (event) {
    if (arguments.length) {
      var re = eventRE(event, true);
      clearMatchingKeys(cache, re);
      if (event.indexOf('*') === -1) {
        delete list[event];
      } else {
        var i = matcherIndex(wildcardList, event);
        if (i !== -1) {
          wildcardList.splice(i, 1);
        }
      }
    } else {
      wildcardList.length = 0;
      clearAll(list);
      clearAll(cache);
    }
  };
}

function createRemoveMatching(list, wildcardList, cache) {
  return function (event, generic) {
    if (typeof generic === 'undefined') {
      generic = true;
    }
    var re = eventRE(event, generic), evt, i;
    clearMatchingKeys(list, re);
    for (i = wildcardList.length - 1; i >= 0; i--) {
      if (re.test(wildcardList[i].event)) {
        wildcardList.splice(i, 1);
      }
    }
    clearMatchingKeys(cache, re);
  };
}

function createGetter(list, wildcardList) {
  return function (event) {
    if (event.indexOf('*') === -1) {
      return list[event] || [];
    }
    var i = matcherIndex(wildcardList, event);
    if (i !== -1) {
      return wildcardList[i].fns;
    }
    return [];
  };
}

function createMatchGetter(list, wildcardList) {
  return function (event) {
    var matches, re = eventRE(event, true);
    eachMatcher(wildcardList, event, re, function (entry) {
      matches = matches ? matches.concat(entry.fns) : entry.fns;
    });
    eachListener(list, event, re, function (entry) {
      matches = matches ? matches.concat(entry) : entry;
    });
    return matches;
  };
}

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
      var proxy;
      if (fn.length) {
        /*jslint evil:true*/
        eval('proxy = (function (' + vars.substring(0, fn.length * 2 - 1) +
          ') { this.hub.removeListener(event, proxy);' +
          'return fn.apply(this, arguments); });');
      } else {
        proxy = function () {
          this.hub.removeListener(event, proxy);
          return fn.apply(this, arguments);
        };
      }
      proxy.fn = fn;
      this.on(event, proxy);
    },

    filterOnce: function (event, fn) {
      var proxy = function (next, callback) {
        this.hub.removeFilter(event, proxy);
        fn.call(this, next, callback);
      };
      proxy.fn = fn;
      this.addFilter(event, proxy);
    },

    removeAllListeners: createRemoveAll(listeners, wildcardListeners,
        listenersCache),
    removeAllFilters: createRemoveAll(filters, wildcardFilters, filtersCache),

    removeMatchingListeners: createRemoveMatching(listeners,
        wildcardListeners, listenersCache),

    removeMatchingFilters: createRemoveMatching(filters, wildcardFilters,
        filtersCache),

    listeners: createGetter(listeners, wildcardListeners),
    filters: createGetter(filters, wildcardFilters),

    listenersMatching: createMatchGetter(listeners, wildcardListeners),
    filtersMatching: createMatchGetter(filters, wildcardFilters),

    emit: function (event) {
      var callback,
        args  = Array.prototype.slice.call(arguments, 1),
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
        var re  = evt.indexOf('*') === -1 ? null : eventRE(evt, true);
        var fns = find(wildcardFilters, filters, evt, re);
        var fn  = buildChain(fns, emitListeners);
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
