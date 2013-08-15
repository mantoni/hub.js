/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');
var store  = require('./store');


function emit(cache, scope, callback) {
  var listener = listen(),
    args       = scope.args,
    argsLength = args.length,
    i          = cache.iterator();
  scope.callback = listener;

  while (i.hasNext()) {
    var fn    = i.next();
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


function createCache() {
  var cache = store();
  var iterator = cache.iterator;
  cache.iterator = function () {
    var i = iterator.call(cache);
    var ii;
    return {

      hasNext: function () {
        if (!ii) {
          if (!i.hasNext()) {
            return false;
          }
          ii = i.next().iterator();
        }
        return ii.hasNext();
      },

      next: function () {
        var v = ii.next();
        if (!ii.hasNext()) {
          ii = null;
        }
        return v;
      }

    };
  };
  cache.toArray = function () {
    var a = [];
    var i = iterator.call(cache);
    while (i.hasNext()) {
      a = a.concat(i.next().toArray());
    }
    return a;
  };
  return cache;
}


function find(matchers, listeners, event, re) {
  var cache = createCache(), i, l = matchers.length;
  for (i = 0; i < l; i++) {
    var entry = matchers[i];
    if (entry.re.test(event) || (re && re.test(entry.event))) {
      cache.push(entry.store);
    }
  }
  if (re) {
    var evt;
    for (evt in listeners) {
      if (listeners.hasOwnProperty(evt) && re.test(evt)) {
        cache.push(listeners[evt]);
      }
    }
  } else if (listeners[event]) {
    cache.push(listeners[event]);
  }
  return cache;
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

function chained(i, then) {
  var fn = function (scope, re, callback) {
    if (i.hasNext()) {
      var next = function (cb) {
        fn(scope, re, cb || callback);
      };
      try {
        i.next().call(scope, next, callback);
      } catch (e) {
        callback(e);
      }
    } else {
      then(scope, re, callback);
    }
  };
  return fn;
}

function buildChain(cache, fn) {
  return function (scope, re, callback) {
    chained(cache.iterator(), fn)(scope, re, callback);
  };
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
  } else if (err && !scope.hub.emit({
      event    : 'error',
      matchers : false
    }, err, scope, throwError)) {
    throw err;
  }
}

function add(newEvent, list, wList, cache) {
  return function (event, fn) {
    this.emit({
      event    : newEvent,
      matchers : false
    }, event, fn, function () {
      var re = eventRE(event, true);
      //clearMatchingKeys(cache, re);
      if (event.indexOf('*') === -1) {
        var s = list[event];
        if (!s) {
          s = list[event] = store();
        }
        s.push(fn);
      } else {
        // TODO speed up matcher lookup with an event->entry map
        var i = matcherIndex(wList, event);
        if (i === -1) {
          var cmp = event.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                          .replace(/\./g, '1')
                          .replace(/\*/g, '2');
          var entry = {
            event : event,
            cmp   : cmp,
            re    : eventRE(event),
            store : store()
          };
          entry.store.push(fn);
          var l = wList.length;
          for (i = 0; i < l; i++) {
            if (cmp > wList[i].cmp) {
              wList.splice(i, 0, entry);
              return;
            }
          }
          wList.push(entry);
        } else {
          wList[i].store.push(fn);
        }
      }
    });
  };
}

function removeFromStore(store, fn) {
  store.remove(fn);
  return store.isEmpty();
}

function remove(removeEvent, list, wList, cache) {
  return function (event, fn) {
    this.emit({
      hub      : this,
      event    : removeEvent,
      matchers : false
    }, event, fn, function () {
      clearMatchingKeys(cache, eventRE(event, true));
      if (event.indexOf('*') === -1) {
        if (list[event] && removeFromStore(list[event], fn)) {
          delete list[event];
        }
      } else {
        var index = matcherIndex(wList, event);
        if (index !== -1 && removeFromStore(wList[index].store, fn)) {
          wList.splice(index, 1);
        }
      }
    });
  };
}

function removeAll(list, wList, cache) {
  return function (event) {
    if (arguments.length) {
      var re = eventRE(event, true);
      clearMatchingKeys(cache, re);
      if (event.indexOf('*') === -1) {
        delete list[event];
      } else {
        var i = matcherIndex(wList, event);
        if (i !== -1) {
          wList.splice(i, 1);
        }
      }
    } else {
      wList.length = 0;
      clearAll(list);
      clearAll(cache);
    }
  };
}

function removeMatching(list, wList, cache) {
  return function (event, generic) {
    if (typeof generic === 'undefined') {
      generic = true;
    }
    var re = eventRE(event, generic), evt, i;
    clearMatchingKeys(list, re);
    for (i = wList.length - 1; i >= 0; i--) {
      if (re.test(wList[i].event)) {
        wList.splice(i, 1);
      }
    }
    clearMatchingKeys(cache, re);
  };
}

function getter(list, wList) {
  return function (event) {
    if (event.indexOf('*') === -1) {
      return list[event] ? list[event].toArray() : [];
    }
    var i = matcherIndex(wList, event);
    if (i !== -1) {
      return wList[i].store.toArray();
    }
    return [];
  };
}

function hub() {
  var listeners  = {};
  var filters    = {};
  var wListeners = [];
  var wFilter    = [];
  var fCache     = {};
  var lCache     = {};

  function listenersMatching(event, re) {
    var cache = lCache[event];
    if (!cache) {
      cache = lCache[event] = find(wListeners, listeners, event, re);
    }
    return cache;
  }

  function emitListeners(scope, re, callback) {
    var cache = listenersMatching(scope.event, re);
    if (cache && !cache.isEmpty()) {
      emit(cache, scope, callback);
    } else {
      callback();
    }
  }

  function filtersMatching(event) {
    var meta = fCache[event];
    if (!meta) {
      var re    = event.indexOf('*') === -1 ? null : eventRE(event, true);
      var cache = find(wFilter, filters, event, re);
      var chain = buildChain(cache, emitListeners);
      meta = fCache[event] = { cache : cache, chain : chain, re : re };
    }
    return meta;
  }

  var vars        = 'a,b,c,d,e,f,g,h,i,j,k,l';
  var addListener = add('newListener', listeners, wListeners, lCache);
  var addFilter   = add('newFilter', filters, wFilter, fCache);

  return {

    on          : addListener,
    addListener : addListener,
    addFilter   : addFilter,

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

    removeFilter   : remove('removeFilter', filters, wFilter, fCache),
    removeListener : remove('removeListener', listeners, wListeners, lCache),

    removeAllListeners : removeAll(listeners, wListeners, lCache),
    removeAllFilters   : removeAll(filters, wFilter, fCache),

    removeMatchingListeners : removeMatching(listeners, wListeners, lCache),
    removeMatchingFilters   : removeMatching(filters, wFilter, fCache),

    listeners : getter(listeners, wListeners),
    filters   : getter(filters, wFilter),

    listenersMatching: function (event) {
      return listenersMatching(event, eventRE(event, true)).toArray();
    },

    filtersMatching: function (event) {
      return filtersMatching(event).cache.toArray();
    },

    emit: function (event) {
      var callback, matchers = true,
        args  = Array.prototype.slice.call(arguments, 1),
        scope = {
          hub        : this,
          event      : event,
          args       : args,
          allResults : false
        };

      if (typeof event === 'object') {
        scope.event = event.event;
        if (event.hasOwnProperty('allResults')) {
          scope.allResults = event.allResults;
        }
        if (event.hasOwnProperty('matchers')) {
          matchers = event.matchers;
        }
      }
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }

      var resultProcessor = function (err, values) {
        processResult(err, values, scope, callback);
      };

      var evt = scope.event;
      if (matchers) {
        var meta = filtersMatching(evt);
        meta.chain(scope, meta.re, resultProcessor);
      } else {
        if (filters[evt]) {
          chained(filters[evt].iterator(), function (scope, re, cb) {
            if (listeners[evt]) {
              emit(listeners[evt], scope, cb);
            } else {
              cb(null, []);
            }
          })(scope, null, resultProcessor);
          return true;
        }
        if (listeners[evt]) {
          emit(listeners[evt], scope, resultProcessor);
          return true;
        }
        callback(null, scope.allResults ? [] : undefined);
        return false;
      }
    }

  };
}

hub.listen = listen;

module.exports = hub;
