/*
 * hub.js
 *
 * Copyright (c) 2012-2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


function emit(listeners, scope, args, values, callback) {
  if (listeners) {
    var listener = listen(values),
      fns        = listeners.slice(),
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
  } else {
    callback(null, values);
  }
}


function eventRE(event, generic) {
  var regexp = '^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+');
  if (generic) {
    regexp = regexp.replace(/([a-zA-Z_0-9\-\:]+)/g, '($1|\\*|\\*\\*)');
  }
  return new RegExp(regexp.replace(/%/g, 'a-zA-Z_0-9\\-\\:\\*') + '$');
}


function call(scope, fns, err) {
  var i, l = fns.length, thrown;
  for (i = 0; i < l; i++) {
    try {
      fns[i].call(scope, err);
    } catch (e) {
      thrown = e;
    }
  }
  if (thrown) {
    throw thrown;
  }
}


function done(scope, callback, err, result) {
  if (callback) {
    callback.call(scope, err, result);
  } else if (err) {
    var fns, dotIndex = scope.event.lastIndexOf('.');
    if (dotIndex !== -1) {
      var errorEvent = scope.event.substring(0, dotIndex) + '.error';
      fns = scope.hub.listeners(errorEvent);
      if (fns.length) {
        call(scope, fns, err);
        return;
      }
    }
    fns = scope.hub.listeners('error');
    if (fns.length) {
      call(scope, fns, err);
      return;
    }
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


function noop() {}


function delegateFunctions(scope, delegate, prefix, map) {
  /*jslint forin: true*/
  var event, listener;
  for (event in map) {
    listener = map[event];
    if (typeof listener === 'function') {
      delegate.call(scope, prefix + event, listener);
    }
  }
}


function multiple(delegate) {
  return function (object, fn) {
    if (typeof object === 'string') {
      if (typeof fn === 'function') {
        delegate.call(this, object, fn);
      } else {
        delegateFunctions(this, delegate, object + '.', fn);
      }
    } else {
      delegateFunctions(this, delegate, '', object);
    }
  };
}


function View(hub, namespace) {
  this.hub        = hub;
  this.namespace  = namespace;
}
View.prototype = {
  toString: function () {
    return '[object hub.View(' + this.namespace + ')]';
  },
  emit: function (event) {
    var args = Array.prototype.slice.call(arguments);
    if (typeof event === 'object') {
      args[0] = {
        event      : this.namespace + '.' + event.event,
        allResults : event.allResults
      };
    } else {
      args[0] = this.namespace + '.' + event;
    }
    this.hub.emit.apply(this.hub, args);
  },
  removeAllListeners: function (event) {
    if (arguments.length) {
      this.hub.removeAllListeners(this.namespace + '.' + event);
    } else {
      this.hub.removeAllMatching(this.namespace + '.**', false);
    }
  }
};
var viewProto = View.prototype;
function viewDelegateOneArg(method) {
  viewProto[method] = function (event) {
    return this.hub[method](this.namespace + '.' + event);
  };
}
function viewDelegateTwoArgs(method) {
  viewProto[method] = multiple(function (event, callback) {
    this.hub[method](this.namespace + '.' + event, callback);
  });
}
viewDelegateOneArg('view');
viewDelegateOneArg('removeAllMatching');
viewDelegateTwoArgs('on');
viewDelegateTwoArgs('un');
viewDelegateTwoArgs('before');
viewDelegateTwoArgs('after');
viewDelegateTwoArgs('once');
viewDelegateTwoArgs('onceBefore');
viewDelegateTwoArgs('onceAfter');
viewProto.addListener = viewProto.on;
viewProto.removeListener = viewProto.un;


function entryListeners(entry) {
  return entry.before.concat(entry.on).concat(entry.after);
}


function combinedErrors(e1, e2) {
  return e1 ? new listen.ErrorList([e1, e2]) : e2;
}

function mergedEntries(a, b) {
  return a ? {
    before : a.before.concat(b.before),
    on     : a.on.concat(b.on),
    after  : a.after.concat(b.after)
  } : b;
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
      cached = mergedEntries(cached, entry);
    });
    cache[event] = cached || {};
  }
  return cache[event][type];
}


var stop = function () {
  this.stopped = true;
};

var arrayPush = Array.prototype.push;


function create() {
  var listeners      = {};
  var matchers       = [];
  var listenersCache = {};
  var matchersCache  = {};

  function listener(event) {
    var entry = listeners[event];
    if (entry) {
      return entry;
    }
    return (listeners[event] = { before : [], on : [], after : [] });
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
      event   : event,
      cmp     : cmp,
      re      : eventRE(event),
      before  : [],
      on      : [],
      after   : []
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
    return entry ? entry[type] : null;
  }

  function findMatchers(type, event, re) {
    return cachedEntries(matchersCache, type, event, re, eachMatcher);
  }

  function createEmitAfter(finder, then) {
    return function (scope, re, args, callback) {
      var fns = finder('after', scope.event, re);
      emit(fns, scope, args, [], function (err) {
        if (scope.stopped) {
          done(scope, callback, err);
        } else {
          if (err) {
            args[0] = combinedErrors(args[0], err);
          }
          then(scope, re, args, callback);
        }
      });
    };
  }

  function doneAfterMatchers(scope, re, args, callback) {
    done(scope, callback, args[0], args[1]);
  }

  var doneAfterListeners = createEmitAfter(findMatchers, doneAfterMatchers);
  var emitAfterListeners = createEmitAfter(findListeners, doneAfterListeners);

  function doneOnListeners(scope, re, args, e, values, callback) {
    var result = values ? (scope.allResults ?
        values : values[values.length - 1]) : null;
    if (scope.stopped) {
      done(scope, callback, e, result);
    } else {
      emitAfterListeners(scope, re, [e, result], callback);
    }
  }

  function createThen(finder, type, then) {
    return function (scope, re, args, e, values, callback) {
      if (scope.stopped) {
        done(scope, callback, e, values);
      } else if (e) {
        doneOnListeners(scope, re, args, e, values, callback);
      } else {
        var fns = finder(type, scope.event, re);
        emit(fns, scope, args, values, function (err, values) {
          then(scope, re, args, err, values, callback);
        });
      }
    };
  }

  var doneOnMatchers      = createThen(findListeners, 'on', doneOnListeners);
  var doneBeforeListeners = createThen(findMatchers, 'on', doneOnMatchers);
  var doneBeforeMatchers  = createThen(findListeners, 'before',
      doneBeforeListeners);

  function register(type) {
    return multiple(function (event, fn) {
      this.emit('newListener', event, fn, noop, function () {
        if (!this.stopped) {
          var re = eventRE(event, true);
          if (event.indexOf('*') === -1) {
            clearMatchingKeys(listenersCache, re);
            listener(event)[type].push(fn);
          } else {
            clearMatchingKeys(matchersCache, re);
            matcher(event)[type].push(fn);
          }
        }
      });
    });
  }

  var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
  function registerOnce(type) {
    return multiple(function (event, fn) {
      var self = this, proxy;
      if (fn.length) {
        /*jslint evil:true*/
        eval('proxy = (function (' + vars.substring(0, fn.length * 2 - 1) +
          ') { self.un(event, proxy); return fn.apply(this, arguments); });');
      } else {
        proxy = function () {
          self.un(event, proxy);
          return fn.apply(this, arguments);
        };
      }
      proxy.fn = fn;
      this[type](event, proxy);
    });
  }

  var removeListener = multiple(function (event, fn) {
    this.emit('removeListener', event, fn, noop, function () {
      if (!this.stopped) {
        var entry, re = eventRE(event, true);
        if (event.indexOf('*') === -1) {
          clearMatchingKeys(listenersCache, re);
          entry = listener(event);
        } else {
          clearMatchingKeys(matchersCache, re);
          entry = matcher(event);
        }
        remove(entry.on, fn);
        remove(entry.before, fn);
        remove(entry.after, fn);
      }
    });
  });

  var addListener = register('on');

  return {

    before         : register('before'),
    on             : addListener,
    addListener    : addListener,
    after          : register('after'),
    once           : registerOnce('on'),
    onceBefore     : registerOnce('before'),
    onceAfter      : registerOnce('after'),
    un             : removeListener,
    removeListener : removeListener,

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
      return entryListeners(entry);
    },

    listenersMatching: function (event) {
      var matches = [], re = eventRE(event, true);
      eachListener(event, re, function (entry) {
        arrayPush.apply(matches, entryListeners(entry));
      });
      eachMatcher(event, re, function (entry) {
        arrayPush.apply(matches, entryListeners(entry));
      });
      return matches;
    },

    emit: function (type) {
      var args     = Array.prototype.slice.call(arguments, 1),
        allResults = false,
        event,
        callback,
        re;

      if (typeof type === 'object') {
        event      = type.event;
        allResults = Boolean(type.allResults);
      } else {
        event = type;
      }
      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }
      if (event.indexOf('*') !== -1) {
        re = eventRE(event, true);
      }

      var scope = {
        hub        : this,
        event      : event,
        args       : args,
        stopped    : false,
        stop       : stop,
        allResults : allResults
      };

      var fns = findMatchers('before', event, re);
      emit(fns, scope, args, [], function (err, values) {
        doneBeforeMatchers(scope, re, args, err, values, callback);
      });
    },

    view: function (namespace) {
      if (typeof namespace !== 'string') {
        throw new TypeError('namespace must be a string');
      }
      return new View(this, namespace);
    }

  };
}


var hub = function (listeners) {
  var instance = create();
  if (listeners) {
    instance.on(listeners);
  }
  return instance;
};

hub.listen = listen;
hub.View   = View;

module.exports = hub;
