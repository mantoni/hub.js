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


function makeTestCase(event, listenerType) {
  return function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub[listenerType](event, spy1);
    this.hub[listenerType](event, spy2);

    this.hub.removeAllListeners();
    this.hub.emit('test.abc');

    sinon.assert.notCalled(spy1);
    sinon.assert.notCalled(spy2);
  };
}


test('hub.removeAllListeners', {

  before: function () {
    this.hub = hub();
  },


  'should remove on(test.abc)'      : makeTestCase('test.abc',  'on'),
  'should remove on(test.*)'        : makeTestCase('test.*',    'on'),
  'should remove on(**)'            : makeTestCase('**',        'on'),

  'should remove before(test.abc)'  : makeTestCase('test.abc',  'before'),
  'should remove before(test.*)'    : makeTestCase('test.*',    'before'),
  'should remove before(**)'        : makeTestCase('**',        'before'),

  'should remove after(test.abc)'   : makeTestCase('test.abc',  'after'),
  'should remove after(test.*)'     : makeTestCase('test.*',    'after'),
  'should remove after(**)'         : makeTestCase('**',        'after')


});
