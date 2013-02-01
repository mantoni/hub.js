/**
 * hub.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test   = require('utest');
var assert = require('assert');
var sinon  = require('sinon');

var hub    = require('../lib/hub');


test('emit-option-allresults', {

  before: function () {
    this.hub = hub();
  },

  'passes all listener results to callback': function () {
    this.hub.on('test', function () { return 'a'; });
    this.hub.on('test', function () { return 'b'; });
    var spy = sinon.spy();

    this.hub.emit('test', hub.options({ allResults : true }), spy);

    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }

});
