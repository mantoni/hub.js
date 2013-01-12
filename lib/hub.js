/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var listen = require('listen');


var DEFAULT_STRATEGY = function (arr) { return arr[arr.length - 1]; };

function emit(listeners, scope, args, values, callback) {
  if (listeners) {
    var listener  = listen(values),
      fns         = listeners.slice(),
      l           = listeners.length,
      i;
    scope.callback = listener;

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


function eventRE(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+').
    replace(/%/g, 'a-zA-Z_0-9\\-\\:\\*') + '$');
}


function invoke(fns, scope, args, values, strategyFn, callback) {
  emit(fns.shift(), scope, args, values, function (err, values) {
    if (err) {
      callback(err);
    } else if (scope.stopped() || !fns.length) {
      callback(null, strategyFn(values));
    } else {
      invoke(fns, scope, args, values, strategyFn, callback);
    }
  });
}


function done(scope, callback, err, result) {
  if (callback) {
    callback.call(scope, err, result);
  } else if (err) {
    throw err;
  }
}


function indexOf(array, object) {
  var i, l = array.length;
  for (i = 0; i < l; i++) {
    if (array[i] === object) {
      return i;
    }
  }
  return -1;
}


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

function multiple(delegate) {
  return function (object, fn) {
    /*jslint forin: true*/
    if (typeOf(object) === 'object') {
      var event, listener;
      for (event in object) {
        listener = object[event];
        if (typeof listener === 'function') {
          delegate.call(this, event, listener);
        }
      }
    } else {
      if (arguments.length < 2) {
        throw new TypeError(NOT_ENOUGH_ARGS_ERRORS[arguments.length]);
      }
      assertType(object, 'string', 'event');
      assertType(fn, 'function', 'listener');
      delegate.call(this, object, fn);
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
    this.hub.emit.apply(null, [this.namespace + '.' + event].concat(args));
  },
  removeAllListeners: function (event) {
    if (arguments.length) {
      assertType(event, 'string', 'event');
      this.hub.removeAllListeners(this.namespace + '.' + event);
    } else {
      this.hub.removeAllListeners(this.namespace);
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

  function register(type) {
    return multiple(function (event, fn) {
      this.emit('newListener', event, fn, noop, function () {
        if (!this.stopped()) {
          var register = (event.indexOf('*') === -1 ? listener : matcher);
          register(event)[type].push(fn);
        }
      });
    });
  }

  function registerOnce(type) {
    return multiple(function (event, fn) {
      var self = this;
      function once() {
        self.un(event, once);
        self.un(event, fn);
      }
      listener(event)[type].push(once);
      this[type](event, fn);
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

    removeAllMatching: function (event) {
      assertType(event, 'string', 'event');
      var re = eventRE(event), evt, i, l;
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
      var matches = [], re = eventRE(event), evt, i, l;
      for (evt in listeners) {
        if (listeners.hasOwnProperty(evt) && re.test(evt)) {
          arrayPush.apply(matches, entryListeners(listeners[evt]));
        }
      }
      for (i = 0, l = matchers.length; i < l; i++) {
        var entry = matchers[i];
        if (entry.re.test(event) || re.test(entry.event)) {
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
      var args      = Array.prototype.slice.call(arguments, 1),
        strategyFn  = DEFAULT_STRATEGY,
        broadcast   = event.indexOf('*') !== -1,
        fns         = [],
        fns2        = [],
        matcherBeforeFns,
        matcherAfterFns,
        matcherOnFns,
        callback,
        entry,
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
        var beforeFns = [];
        var onFns     = [];
        var afterFns  = [];
        for (evt in listeners) {
          if (listeners.hasOwnProperty(evt) && re.test(evt)) {
            entry = listeners[evt];
            arrayPush.apply(beforeFns, entry.before);
            arrayPush.apply(onFns, entry.on);
            arrayPush.apply(afterFns, entry.after);
          }
        }
        fns.push(beforeFns);
        fns.push(onFns);
        fns2.push(afterFns);
      } else {
        entry = listeners[event];
        if (entry) {
          if (entry.before.length) {
            fns.push(entry.before);
          }
          if (entry.on.length) {
            fns.push(entry.on);
          }
          if (entry.after.length) {
            fns2.push(entry.after);
          }
        }
      }

      for (i = 0, l = matchers.length; i < l; i++) {
        var matcher = matchers[i];
        if (matcher.re.test(event) || (re && re.test(matcher.event))) {
          if (!matcherOnFns) {
            matcherBeforeFns  = [];
            matcherAfterFns   = [];
            matcherOnFns      = [];
          }
          arrayPush.apply(matcherBeforeFns, matcher.before);
          arrayPush.apply(matcherOnFns, matcher.on);
          arrayPush.apply(matcherAfterFns, matcher.after);
        }
      }
      if (matcherOnFns) {
        if (matcherOnFns.length) {
          fns.unshift(matcherOnFns);
        }
        if (matcherBeforeFns.length) {
          fns.unshift(matcherBeforeFns);
        }
        if (matcherAfterFns.length) {
          fns2.push(matcherAfterFns);
        }
      }

      var scope;
      var stopped   = false;
      var dotIndex  = event.lastIndexOf('.');
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

      invoke(fns, scope, args, [], strategyFn, function (err, result) {
        if (stopped) {
          done(scope, callback, err, result);
        } else {
          invoke(fns2, scope, [err, result], [], noop, function () {
            done(scope, callback, err, result);
          });
        }
      });
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
hub.LAST    = DEFAULT_STRATEGY;
hub.CONCAT  = function (arr) { return arr; };
hub.View    = View;

module.exports = hub;
