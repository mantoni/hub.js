/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test    = require('utest');
var assert  = require('assert');
var sinon   = require('sinon');

var hub     = require('../lib/hub');


function noArgs(method) {
  return function () {
    try {
      this.hub[method]();
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No arguments given.');
    }
  };
}

function noFunc(method) {
  return function () {
    try {
      this.hub[method]('some.event');
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'No listener function given.');
    }
  };
}

function eventType(method, arg, actual) {
  return function () {
    try {
      this.hub[method](arg, function () {});
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected event to be string, but it was ' + actual);
    }
  };
}

function listenerType(method, arg, actual) {
  return function () {
    try {
      this.hub[method]('the.event', arg);
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message,
        'Expected listener to be function, but it was ' + actual);
    }
  };
}


test('errors', {

  before: function () {
    this.hub = hub();
  },

  'on throws if no arguments are given'     : noArgs('on'),
  'before throws if no arguments are given' : noArgs('before'),
  'after throws if no arguments are given'  : noArgs('after'),

  'on throws if no listener function is given'      : noFunc('on'),
  'before throws if no listener function is given'  : noFunc('before'),
  'after throws if no listener function is given'   : noFunc('after'),

  'on throws if event is number'     : eventType('on',      1, 'number'),
  'before throws if event is number' : eventType('before',  1, 'number'),
  'after throws if event is number'  : eventType('after',   1, 'number'),

  'on throws if event is null'     : eventType('on',      null, 'null'),
  'before throws if event is null' : eventType('before',  null, 'null'),
  'after throws if event is null'  : eventType('after',   null, 'null'),

  'on throws if event is undefined'     : eventType('on',     undefined,
    'undefined'),
  'before throws if event is undefined' : eventType('before', undefined,
    'undefined'),
  'after throws if event is undefined'  : eventType('after',  undefined,
    'undefined'),

  'on throws if event is object'      : eventType('on',      {}, 'object'),
  'before throws if event is object'  : eventType('before',  {}, 'object'),
  'after throws if event is object'   : eventType('after',   {}, 'object'),

  'on throws if event is array'     : eventType('on',      [], 'array'),
  'before throws if event is array' : eventType('before',  [], 'array'),
  'after throws if event is array'  : eventType('after',   [], 'array'),

  'on throws if listener is string'    : listenerType('on',     '', 'string'),
  'before throws if listener is string': listenerType('before', '', 'string'),
  'after throws if listener is string' : listenerType('after',  '', 'string'),

  'on throws if listener is date'     : listenerType('on',
    new Date(), 'date'),
  'before throws if listener is date': listenerType('before',
    new Date(), 'date'),
  'after throws if listener is date'  : listenerType('after',
    new Date(), 'date'),


  'un throws if no arguments are given'         : noArgs('un'),
  'un throws if no listener function is given'  : noFunc('un'),
  'un throws if event is null'      : eventType('un', null, 'null'),
  'un throws if listener is string' : listenerType('un', '', 'string'),

  'once throws if no arguments are given'         : noArgs('once'),
  'once throws if no listener function is given'  : noFunc('once'),
  'once throws if event is null'      : eventType('once', null, 'null'),
  'once throws if listener is string' : listenerType('once', '', 'string'),

  'emit throws if no arguments are given' : noArgs('emit')

});
