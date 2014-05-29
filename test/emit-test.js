/*
 * hub.js
 *
 * Copyright (c) 2012-2014 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it, beforeEach*/
'use strict';

var assert       = require('assert');
var Filter       = require('glob-filter').Filter;
var AsyncEmitter = require('async-glob-events').AsyncEmitter;
var hub          = require('../lib/hub');



describe('emit', function () {
  var h;
  var c;

  function listener() {
    c += 'l';
  }

  beforeEach(function () {
    h = hub.create();
    c = '';
  });

  it('invokes filter and listener', function () {
    h.addFilter('a', function () {
      c += 'f';
    });
    h.addListener('a', listener);

    h.emit('a');

    assert.equal(c, 'fl');
  });

  it('does not invoke listener if filter does not yield', function () {
    h.addFilter('a', function (next) {
      /*jslint unparam: true*/
      c += 'f';
    });
    h.addListener('a', listener);

    h.emit('a');

    assert.equal(c, 'f');
  });

  it('invokes listener even if filter throws', function () {
    h.addFilter('a', function () {
      throw new Error();
    });
    h.addListener('a', listener);

    h.emit('a');

    assert.equal(c, 'l');
  });

  it('yields error from filter', function () {
    var error = new Error();
    h.addFilter('a', function () {
      throw error;
    });

    var err;
    h.emit('a', function (e) {
      err = e;
    });

    assert.strictEqual(err, error);
  });

  it('yields error from listener', function () {
    var error = new Error();
    h.addListener('a', function () {
      throw error;
    });

    var err;
    h.emit('a', function (e) {
      err = e;
    });

    assert.strictEqual(err, error);
  });

  it('passes error from listener back to filter', function () {
    var error = new Error();
    h.addListener('a', function () {
      throw error;
    });
    var err;
    h.addFilter('a', function (next) {
      next(function (e) {
        err = e;
      });
    });

    h.emit('a');

    assert.strictEqual(err, error);
  });

});
