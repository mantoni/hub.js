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

function find(matchers, listeners, event, re) {
  var m = [], i, l = matchers.length;
  for (i = 0; i < l; i++) {
    var entry = matchers[i];
    if (entry.re.test(event) || (re && re.test(entry.event))) {
      m = m.concat(entry.fns);
    }
  }
  if (re) {
    var evt;
    for (evt in listeners) {
      if (listeners.hasOwnProperty(evt) && re.test(evt)) {
        m = m.concat(listeners[evt]);
      }
    }
  } else if (listeners[event]) {
    m = m.concat(listeners[event]);
  }
  return m;
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

function chain(filter, then) {
  return function (scope, re, callback) {
    function next(cb) {
      then(scope, re, cb || callback);
    }
    try {
      filter.call(scope, next, callback);
    } catch (e) {
      callback(e);
    }
  };
}

function buildChain(fns, fn) {
  if (fns.length) {
    var i;
    for (i = fns.length - 1; i >= 0; i--) {
      fn = chain(fns[i], fn);
    }
  }
  return fn;
}

function emitInternal(scope, callback) {
  var filters   = scope.hub.filters(scope.event);
  var listeners = scope.hub.listeners(scope.event);
  if (filters.length || listeners.length) {
    buildChain(filters, function (scope, re, callback) {
      emit(listeners, scope, callback);
    })(scope, null, callback);
    return true;
  }
  callback();
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
  } else if (err && !emitInternal({
      hub   : scope.hub,
      event : 'error',
      args  : [err],
      cause : scope
    }, throwError)) {
    throw err;
  }
}

function add(newEvent, list, wList, cache) {
  return function (event, fn) {
    emitInternal({
      hub   : this,
      event : newEvent,
      args  : [event, fn]
    }, function () {
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
        var i = matcherIndex(wList, event);
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
          var l = wList.length;
          for (i = 0; i < l; i++) {
            if (cmp > wList[i].cmp) {
              wList.splice(i, 0, entry);
              return;
            }
          }
          wList.push(entry);
        } else {
          wList[i].fns.push(fn);
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

function remove(removeEvent, list, wList, cache) {
  return function (event, fn) {
    emitInternal({
      hub   : this,
      event : removeEvent,
      args  : [event, fn]
    }, function () {
      clearMatchingKeys(cache, eventRE(event, true));
      if (event.indexOf('*') === -1) {
        if (list[event] && !removeFromEntry(list[event], fn)) {
          delete list[event];
        }
      } else {
        var index = matcherIndex(wList, event);
        if (index !== -1 && !removeFromEntry(wList[index].fns, fn)) {
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
      return list[event] || [];
    }
    var i = matcherIndex(wList, event);
    if (i !== -1) {
      return wList[i].fns;
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
    var fns = lCache[event];
    if (!fns) {
      fns = lCache[event] = find(wListeners, listeners, event, re);
    }
    return fns;
  }

  function emitListeners(scope, re, callback) {
    var fns = listenersMatching(scope.event, re);
    if (fns && fns.length) {
      emit(fns, scope, callback);
    } else {
      callback();
    }
  }

  function filtersMatching(event) {
    var cache = fCache[event];
    if (!cache) {
      var re    = event.indexOf('*') === -1 ? null : eventRE(event, true);
      var fns   = find(wFilter, filters, event, re);
      var chain = buildChain(fns, emitListeners);
      cache = fCache[event] = { fns : fns, chain : chain, re : re };
    }
    return cache;
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
      return listenersMatching(event, eventRE(event, true));
    },

    filtersMatching: function (event) {
      return filtersMatching(event).fns;
    },

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

      var cache = filtersMatching(scope.event);
      cache.chain(scope, cache.re, function (err, values) {
        processResult(err, values, scope, callback);
      });
    }

  };
}

hub.listen = listen;

module.exports = hub;
