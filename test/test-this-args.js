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

  'should return emitted arguments in before(*)'    : run('before', '*'),
  'should return emitted arguments in on(*)'        : run('on', '*'),
  'should return emitted arguments in after(*)'     : run('after', '*'),
  'should return emitted arguments in before(test)' : run('before', 'test'),
  'should return emitted arguments in on(test)'     : run('on', 'test'),
  'should return emitted arguments in after(test)'  : run('after', 'test')

});
