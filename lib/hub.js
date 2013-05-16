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

    listener.then(function (err, values) {
      callback.call(scope, err, values);
    });
  } else {
    callback.call(scope, null, values);
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


var indexOf = Array.prototype.indexOf ? function (array, object) {
  return array.indexOf(object);
} : function indexOf(array, object) {
  var i, l = array.length;
  for (i = 0; i < l; i++) {
    if (array[i] === object) {
      return i;
    }
  }
  return -1;
};


function remove(array, object) {
  var i = indexOf(array, object);
  if (i !== -1) {
    array.splice(i, 1);
  }
}


function typeOf(value) {
  if (value === null) {
    return 'null';
  }
  var type = Object.prototype.toString.call(value);
  return type.substring(8, type.length - 1).toLowerCase();
}


function assertType(value, expectation, name) {
  var type = typeOf(value);
  if (type !== expectation) {
    throw new TypeError('Expected ' + name + ' to be ' + expectation +
      ', but it was ' + type);
  }
}


function noop() {}


var NOT_ENOUGH_ARGS_ERRORS = [
  'No arguments given.',
  'No listener function given.'
];


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
    if (typeOf(object) === 'object') {
      delegateFunctions(this, delegate, '', object);
    } else {
      if (arguments.length < 2) {
        throw new TypeError(NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
      }
      assertType(object, 'string', 'event');
      if (typeOf(fn) === 'object') {
        delegateFunctions(this, delegate, object + '.', fn);
      } else {
        assertType(fn, 'function', 'listener');
        delegate.call(this, object, fn);
      }
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
    if (arguments.length === 0) {
      throw new TypeError(NOT_ENOUGH_ARGS_ERRORS[0]);
    }
    assertType(event, 'string', 'event');
    var args = Array.prototype.slice.call(arguments, 1);
    args.unshift(this.namespace + '.' + event);
    this.hub.emit.apply(this.hub, args);
  },
  removeAllListeners: function (event) {
    if (arguments.length) {
      assertType(event, 'string', 'event');
      this.hub.removeAllListeners(this.namespace + '.' + event);
    } else {
      this.hub.removeAllMatching(this.namespace + '.**', false);
    }
  }
};
var viewProto = View.prototype;
function viewDelegateOneArg(method) {
  viewProto[method] = function (event) {
    assertType(event, 'string', 'event');
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


function clearEntry(entry) {
  entry.before.length = 0;
  entry.on.length     = 0;
  entry.after.length  = 0;
}


function entryListeners(entry) {
  return entry.before.concat(entry.on).concat(entry.after);
}


function createPrototype(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
}

function returnsTrue() {
  return true;
}

function returnsFalse() {
  return false;
}

function Options(config) {
  if (config.hasOwnProperty('allResults')) {
    assertType(config.allResults, 'boolean', 'allResults');
  }
  this.allResults = config.allResults ? returnsTrue : returnsFalse;
}
Options.prototype.toString = function () {
  return '[object hub.Options]';
};
var DEFAULT_OPTIONS = new Options({});


function result(scope, values) {
  return values ? (scope.options.allResults() ?
      values : values[values.length - 1]) : null;
}


function combinedErrors(e1, e2) {
  return e1 ? new listen.ErrorList([e1, e2]) : e2;
}


var arrayPush = Array.prototype.push;


function create() {
  var listeners = {};
  var matchers  = [];

  function listener(event) {
    var entry = listeners[event];
    if (entry) {
      return entry;
    }
    return (listeners[event] = { before : [], on : [], after : [] });
  }

  function matcher(event) {
    var i, l = matchers.length, entry;
    for (i = 0; i < l; i++) {
      entry = matchers[i];
      if (entry.event === event) {
        return entry;
      }
    }
    var cmp = event.replace(/[a-zA-Z_0-9\-\:]+/g, '0')
                    .replace(/\./g, '1')
                    .replace(/\*/g, '2');
    entry = {
      event   : event,
      cmp     : cmp,
      re      : eventRE(event),
      before  : [],
      on      : [],
      after   : []
    };
    for (i = 0, l = matchers.length; i < l; i++) {
      if (cmp > matchers[i].cmp) {
        matchers.splice(i, 0, entry);
        return entry;
      }
    }
    matchers.push(entry);
    return entry;
  }

  function findListeners(type, event, re) {
    var entry;
    if (re) {
      var evt, entries;
      for (evt in listeners) {
        if (listeners.hasOwnProperty(evt) && re.test(evt)) {
          entry   = listeners[evt][type];
          entries = entries ? entries.concat(entry) : entry;
        }
      }
      return entries;
    }
    entry = listeners[event];
    return entry ? entry[type] : null;
  }

  function findMatchers(type, event, re) {
    var i, l = matchers.length, entries;
    for (i = 0; i < l; i++) {
      var matcher = matchers[i];
      if (matcher.re.test(event) || (re && re.test(matcher.event))) {
        entries = entries ? entries.concat(matcher[type]) : matcher[type];
      }
    }
    return entries;
  }

  function register(type) {
    return multiple(function (event, fn) {
      this.emit('newListener', event, fn, noop, function () {
        if (!this.stopped()) {
          var bucket = (event.indexOf('*') === -1 ? listener : matcher);
          bucket(event)[type].push(fn);
        }
      });
    });
  }

  var vars = "a,b,c,d,e,f,g,h,i,j,k,l";
  function registerOnce(type) {
    return multiple(function (event, fn) {
      /*jslint evil:true*/
      var self = this, proxy;
      if (fn.length) {
        eval('proxy = (function (' + vars.substring(0, fn.length * 2 - 1) +
          ') { self.un(event, proxy); return fn.apply(this, arguments); });');
      } else {
        proxy = function () {
          self.un(event, proxy);
          return fn.apply(this, arguments);
        };
      }
      this[type](event, proxy);
    });
  }

  var removeListener = multiple(function (event, fn) {
    this.emit('removeListener', event, fn, noop, function () {
      if (!this.stopped()) {
        var entry;
        if (event.indexOf('*') === -1) {
          entry = listener(event);
        } else {
          entry = matcher(event);
        }
        remove(entry.on,      fn);
        remove(entry.before,  fn);
        remove(entry.after,   fn);
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
        assertType(event, 'string', 'event');
        if (event.indexOf('*') === -1) {
          delete listeners[event];
        } else {
          clearEntry(matcher(event));
        }
      } else {
        listeners = {};
        matchers.length = 0;
      }
    },

    removeAllMatching: function (event, generic) {
      assertType(event, 'string', 'event');
      if (typeof generic === 'undefined') {
        generic = true;
      }
      var re = eventRE(event, generic), evt, i, l;
      for (evt in listeners) {
        if (listeners.hasOwnProperty(evt) && re.test(evt)) {
          delete listeners[evt];
        }
      }
      for (i = 0, l = matchers.length; i < l; i++) {
        var entry = matchers[i];
        if (re.test(entry.event)) {
          clearEntry(entry);
        }
      }
    },

    listeners: function (event) {
      assertType(event, 'string', 'event');
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
      assertType(event, 'string', 'event');
      var matches = [], re = eventRE(event, true), evt, i, l;
      for (evt in listeners) {
        if (listeners.hasOwnProperty(evt) && re.test(evt)) {
          arrayPush.apply(matches, entryListeners(listeners[evt]));
        }
      }
      for (i = 0, l = matchers.length; i < l; i++) {
        var entry = matchers[i];
        if (re.test(entry.event)) {
          arrayPush.apply(matches, entryListeners(entry));
        }
      }
      return matches;
    },

    emit: function (event) {
      if (arguments.length === 0) {
        throw new TypeError(NOT_ENOUGH_ARGS_ERRORS[0]);
      }
      assertType(event, 'string', 'event');
      var args  = Array.prototype.slice.call(arguments, 1),
        options = DEFAULT_OPTIONS,
        callback,
        re,
        scope,
        stopped  = false,
        dotIndex = event.lastIndexOf('.');

      if (typeof args[args.length - 1] === 'function') {
        callback = args.pop();
      }
      if (args[args.length - 1] instanceof Options) {
        options = args.pop();
      }
      if (event.indexOf('*') !== -1) {
        re = eventRE(event, true);
      }

      if (dotIndex === -1) {
        scope = createPrototype(this);
        scope.hub = this;
      } else {
        var namespace = event.substring(0, dotIndex);
        scope = new View(this, namespace);
      }
      scope.event   = event;
      scope.args    = function () { return args.slice(); };
      scope.stop    = function () { stopped = true; };
      scope.stopped = function () { return stopped; };
      scope.options = options;

      function emitPhase(finder, type, args, values, then, after) {
        var listeners = finder(type, event, re);
        emit(listeners, scope, args, values, function (err, values) {
          if (err && after) {
            after(err);
          } else if (stopped) {
            done(scope, callback, err, result(scope, values));
          } else {
            then(err, values);
          }
        });
      }

      function afterMatchers(args) {
        emitPhase(findMatchers, 'after', args, [], function () {
          done(scope, callback, args[0], args[1]);
        }, function (e) {
          done(scope, callback, combinedErrors(args[0], e));
        });
      }

      function after(err, values) {
        var args = [err, result(scope, values)];
        emitPhase(findListeners, 'after', args, [], function () {
          afterMatchers(args);
        }, function (e) {
          args[0] = combinedErrors(err, e);
          afterMatchers(args);
        });
      }

      emitPhase(findMatchers, 'before', args, [], function (e, values) {
        emitPhase(findListeners, 'before', args, values,
          function (e, values) {
            emitPhase(findMatchers, 'on', args, values, function (e, values) {
              emitPhase(findListeners, 'on', args, values, after);
            }, after);
          }, after);
      }, after);

    },

    view: function (namespace) {
      assertType(namespace, 'string', 'namespace');
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

hub.listen  = listen;
hub.View    = View;
hub.Options = Options;
hub.options = function (config) {
  return new hub.Options(config);
};

module.exports = hub;
