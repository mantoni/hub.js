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

var hub    = require('../lib/hub');


function run(method, event) {
  return function () {
    var h = hub();
    var args;
    h[method](event, function () {
      args = this.args;
    });

    h.emit('test', 123, 'abc', [true, false]);

    assert.deepEqual(args, [123, 'abc', [true, false]]);
  };
}


test('this.args', {

  'should return emitted arguments in on(*)'    : run('on', '*'),
  'should return emitted arguments in on(test)' : run('on', 'test')

});
