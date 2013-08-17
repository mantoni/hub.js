/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');
var list   = require('./list');
var cache  = require('./cache');


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

function clearMatchingKeys(object, re) {
  var key;
  for (key in object) {
    if (object.hasOwnProperty(key) && re.test(key)) {
      delete object[key];
    }
  }
}

function find(matchers, listeners, event, re) {
  var c = cache(), i, l = matchers.length;
  for (i = 0; i < l; i++) {
    var entry = matchers[i];
    if (entry.re.test(event) || (re && re.test(entry.event))) {
      c.push(entry.list);
    }
  }
  if (re) {
    var evt;
    for (evt in listeners) {
      if (listeners.hasOwnProperty(evt) && re.test(evt)) {
        c.push(listeners[evt]);
      }
    }
  } else if (listeners[event]) {
    c.push(listeners[event]);
  }
  return c;
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

function add(newEvent, lists, wLists, cache) {
  return function (event, fn) {
    this.emit({
      event    : newEvent,
      matchers : false
    }, event, fn, function () {
      var newList;
      if (event.indexOf('*') === -1) {
        var s = lists[event];
        if (!s) {
          newList = s = lists[event] = list();
        }
        s.push(fn);
      } else {
        // TODO speed up matcher lookup with an event->entry map
        var i = matcherIndex(wLists, event);
        if (i === -1) {
          var cmp = event.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                          .replace(/\./g, '1')
                          .replace(/\*/g, '2');
          newList = list();
          var entry = {
            event : event,
            cmp   : cmp,
            re    : eventRE(event),
            list  : newList
          };
          entry.list.push(fn);
          var l = wLists.length;
          for (i = 0; i < l; i++) {
            if (cmp > wLists[i].cmp) {
              wLists.splice(i, 0, entry);
              // FIXME must add newList to existing caches
              return;
            }
          }
          wLists.push(entry);
        } else {
          wLists[i].list.push(fn);
        }
      }
      if (newList) {
        var re = eventRE(event, true);
        var key;
        for (key in cache) {
          if (cache.hasOwnProperty(key) && re.test(key)) {
            cache[key].push(newList);
          }
        }
      }
    });
  };
}

function removeFromStore(list, fn) {
  list.remove(fn);
  return list.isEmpty();
}

function remove(removeEvent, lists, wLists, cache) {
  return function (event, fn) {
    this.emit({
      hub      : this,
      event    : removeEvent,
      matchers : false
    }, event, fn, function () {
      if (event.indexOf('*') === -1) {
        if (lists[event] && removeFromStore(lists[event], fn)) {
          delete lists[event];
        }
      } else {
        var index = matcherIndex(wLists, event);
        if (index !== -1 && removeFromStore(wLists[index].list, fn)) {
          wLists.splice(index, 1);
        }
      }
    });
  };
}

function removeAll(lists, wLists, cache) {
  return function (event) {
    if (arguments.length) {
      var oldList;
      if (event.indexOf('*') === -1) {
        if (lists[event]) {
          oldList = lists[event];
          delete lists[event];
        }
      } else {
        var index = matcherIndex(wLists, event);
        if (index !== -1) {
          oldList = wLists[index].list;
          wLists.splice(index, 1);
        }
      }
      if (oldList) {
        oldList.removeAll();
        /*
        var re = eventRE(event, true);
        for (key in cache) {
          if (cache.hasOwnProperty(key) && re.test(key)) {
            cache[key].remove(oldList);
          }
        }
        */
      }
    } else {
      wLists.length = 0;
      var key;
      for (key in lists) {
        if (lists.hasOwnProperty(key)) {
          delete lists[key];
        }
      }
      for (key in cache) {
        if (cache.hasOwnProperty(key)) {
          cache[key].removeAll();
          delete cache[key];
        }
      }
    }
  };
}

function removeMatching(lists, wLists, cache) {
  return function (event, generic) {
    if (typeof generic === 'undefined') {
      generic = true;
    }
    var re = eventRE(event, generic), evt, i;
    clearMatchingKeys(lists, re);
    for (i = wLists.length - 1; i >= 0; i--) {
      if (re.test(wLists[i].event)) {
        wLists.splice(i, 1);
      }
    }
    clearMatchingKeys(cache, re);
  };
}

function getter(lists, wLists) {
  return function (event) {
    if (event.indexOf('*') === -1) {
      return lists[event] ? lists[event].toArray() : [];
    }
    var i = matcherIndex(wLists, event);
    if (i !== -1) {
      return wLists[i].list.toArray();
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
    var c = lCache[event];
    if (!c) {
      c = lCache[event] = find(wListeners, listeners, event, re);
    }
    return c;
  }

  function emitListeners(scope, re, callback) {
    var c = listenersMatching(scope.event, re);
    if (c && !c.isEmpty()) {
      emit(c, scope, callback);
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
      meta = fCache[event] = {
        cache     : cache,
        chain     : chain,
        re        : re,
        push      : function (s) { cache.push(s); },
        remove    : function (s) { cache.remove(s); },
        removeAll : function () { cache.removeAll(); }
      };
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
