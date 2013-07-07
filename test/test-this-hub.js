/*
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var hub    = require('../lib/hub');


function run(method, event) {
  return function () {
    var h   = hub();
    var spy = sinon.spy();
    h[method](event, spy);

    h.emit('test');

    assert.strictEqual(spy.thisValues[0].hub, h);
  };
}


test('this.hub', {

  'should be hub instance in on(*)'    : run('on', '*'),

  'should be hub instance in on(test)' : run('on', 'test')

});
