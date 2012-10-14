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

var hub     = require('../lib/hub');


test('hub.removeListener', {

  before: function () {
    this.hub = hub();
  },


  'should be alias for hub.un': function () {
    assert.strictEqual(this.hub.removeListener, this.hub.un);
  }

});
