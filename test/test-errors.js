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
    } catch (e1) {
      assert.equal(e1.name, 'TypeError');
      assert.equal(e1.message, 'No arguments given.');
    }
    try {
      this.hub.view('test')[method]();
      assert.fail('Exception expected');
    } catch (e2) {
      assert.equal(e2.name, 'TypeError');
      assert.equal(e2.message, 'No arguments given.');
    }
  };
}

function noFunc(method) {
  return function () {
    try {
      this.hub[method]('some.event');
      assert.fail('Exception expected');
    } catch (e1) {
      assert.equal(e1.name, 'TypeError');
      assert.equal(e1.message, 'No listener function given.');
    }
    try {
      this.hub.view('test')[method]('some.event');
      assert.fail('Exception expected');
    } catch (e2) {
      assert.equal(e2.name, 'TypeError');
      assert.equal(e2.message, 'No listener function given.');
    }
  };
}

function eventType(method, arg, actual) {
  return function () {
    try {
      this.hub[method](arg, function () {});
      assert.fail('Exception expected');
    } catch (e1) {
      assert.equal(e1.name, 'TypeError');
      assert.equal(e1.message,
        'Expected event to be string, but it was ' + actual);
    }
    try {
      this.hub.view('test')[method](arg, function () {});
      assert.fail('Exception expected');
    } catch (e2) {
      assert.equal(e2.name, 'TypeError');
      assert.equal(e2.message,
        'Expected event to be string, but it was ' + actual);
    }
  };
}

function listenerType(method, arg, actual) {
  return function () {
    try {
      this.hub[method]('the.event', arg);
      assert.fail('Exception expected');
    } catch (e1) {
      assert.equal(e1.name, 'TypeError');
      assert.equal(e1.message,
        'Expected listener to be function, but it was ' + actual);
    }
    try {
      this.hub.view('test')[method]('the.event', arg);
      assert.fail('Exception expected');
    } catch (e2) {
      assert.equal(e2.name, 'TypeError');
      assert.equal(e2.message,
        'Expected listener to be function, but it was ' + actual);
    }
  };
}

var now = new Date();


test('errors', {

  before: function () {
    this.hub = hub();
  },

  'on throws if no arguments are given'     : noArgs('on'),
  'before throws if no arguments are given' : noArgs('before'),
  'after throws if no arguments are given'  : noArgs('after'),
  'un throws if no arguments are given'     : noArgs('un'),
  'once throws if no arguments are given'   : noArgs('once'),
  'emit throws if no arguments are given'   : noArgs('emit'),

  'on throws if no listener function is given'      : noFunc('on'),
  'before throws if no listener function is given'  : noFunc('before'),
  'after throws if no listener function is given'   : noFunc('after'),
  'un throws if no listener function is given'      : noFunc('un'),
  'once throws if no listener function is given'    : noFunc('once'),

  'on throws if event is number'      : eventType('on',     1, 'number'),
  'before throws if event is number'  : eventType('before', 1, 'number'),
  'after throws if event is number'   : eventType('after',  1, 'number'),
  'un throws if event is number'      : eventType('un',     1, 'number'),
  'once throws if event is number'    : eventType('once',   1, 'number'),
  'emit throws if event is number'    : eventType('emit',   1, 'number'),

  'on throws if event is null'      : eventType('on',     null, 'null'),
  'before throws if event is null'  : eventType('before', null, 'null'),
  'after throws if event is null'   : eventType('after',  null, 'null'),
  'un throws if event is null'      : eventType('un',     null, 'null'),
  'once throws if event is null'    : eventType('once',   null, 'null'),
  'emit throws if event is null'    : eventType('emit',   null, 'null'),

  'on throws if event is undefined'     : eventType('on',     undefined,
    'undefined'),
  'before throws if event is undefined' : eventType('before', undefined,
    'undefined'),
  'after throws if event is undefined'  : eventType('after',  undefined,
    'undefined'),
  'un throws if event is undefined'     : eventType('un',     undefined,
    'undefined'),
  'once throws if event is undefined'   : eventType('once',   undefined,
    'undefined'),
  'emit throws if event is undefined'   : eventType('emit',   undefined,
    'undefined'),

  'on throws if event is object'      : eventType('on',     {}, 'object'),
  'before throws if event is object'  : eventType('before', {}, 'object'),
  'after throws if event is object'   : eventType('after',  {}, 'object'),
  'un throws if event is object'      : eventType('un',     {}, 'object'),
  'once throws if event is object'    : eventType('once',   {}, 'object'),
  'emit throws if event is object'    : eventType('emit',   {}, 'object'),

  'on throws if event is array'     : eventType('on',     [], 'array'),
  'before throws if event is array' : eventType('before', [], 'array'),
  'after throws if event is array'  : eventType('after',  [], 'array'),
  'un throws if event is array'     : eventType('un',     [], 'array'),
  'once throws if event is array'   : eventType('once',   [], 'array'),
  'emit throws if event is array'   : eventType('emit',   [], 'array'),

  'on throws if listener is string'    : listenerType('on',     '', 'string'),
  'before throws if listener is string': listenerType('before', '', 'string'),
  'after throws if listener is string' : listenerType('after',  '', 'string'),
  'un throws if listener is string'    : listenerType('un',     '', 'string'),
  'once throws if listener is string'  : listenerType('once',   '', 'string'),

  'on throws if listener is date'     : listenerType('on',      now, 'date'),
  'before throws if listener is date' : listenerType('before',  now, 'date'),
  'after throws if listener is date'  : listenerType('after',   now, 'date'),
  'un throws if listener is date'     : listenerType('un',      now, 'date'),
  'once throws if listener is date'   : listenerType('once',    now, 'date')

});
