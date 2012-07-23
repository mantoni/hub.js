/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var emit      = require('./emit');
var strategy  = require('./strategy');


function eventRE(event) {
  return new RegExp('^' + event.replace(/\./g, '\\.').
    replace(/\*\*/g, '[%\\.]+').replace(/\*/g, '[%]+').
    replace(/%/g, 'a-z\\*') + '$');
}


function create() {
  var listeners = {};
  var matchers  = [];

  function entry(event) {
    var e = listeners[event];
    if (!e) {
      listeners[event] = e = { on : [] };
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
        strategyFn    = strategy.LAST,
        broadcast     = event.indexOf('*') !== -1,
        listenerFns,
        matcherFns,
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
        listenerFns = [];
        for (evt in listeners) {
          if (listeners.hasOwnProperty(evt) && re.test(evt)) {
            listenerFns.push.apply(listenerFns, listeners[evt].on);
          }
        }
      } else {
        var entry = listeners[event];
        if (entry) {
          listenerFns = entry.on;
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
        emit.matchers(this, event, matcherFns, listenerFns, args, strategyFn,
                        callback);
      } else {
        emit.listeners(listenerFns, args, [], strategyFn, callback);
      }
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

hub.listen      = require("listen");

hub.LAST        = strategy.LAST;
hub.CONCAT      = strategy.CONCAT;

module.exports  = hub;
