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


test('this.options', {

  before: function () {
    this.hub = hub();
  },


  'should be an instance of hub.Options': function () {
    var options;

    this.hub.on('test', function () {
      options = this.options;
    });
    this.hub.emit('test');

    assert(options instanceof hub.Options);
  },


  'should be the options object passed to emit': function () {
    var emitOptions = hub.options({ allResults : true });
    var thisOptions;

    this.hub.on('test', function () {
      thisOptions = this.options;
    });
    this.hub.emit('test', emitOptions);

    assert.strictEqual(thisOptions, emitOptions);
  }

});
