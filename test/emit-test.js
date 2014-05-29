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
var sinon        = require('sinon');
var Filter       = require('glob-filter').Filter;
var AsyncEmitter = require('async-glob-events').AsyncEmitter;
var hub          = require('../lib/hub');


describe('emit', function () {
  var h;

  beforeEach(function () {
    h = hub.create();
  });

  it('invokes filter and listener', function () {
    var f = sinon.spy();
    var l = sinon.spy();
    h.addFilter('a', f);
    h.addListener('a', l);

    h.emit('a');

    sinon.assert.callOrder(f, l);
  });

  it('does not invoke listener if filter does not yield', function () {
    var spy = sinon.spy();
    h.addFilter('a', function (next) {
      /*jslint unparam: true*/
      return;
    });
    h.addListener('a', spy);

    h.emit('a');

    sinon.assert.notCalled(spy);
  });

  it('invokes listener even if filter throws', function () {
    var spy = sinon.spy();
    h.addFilter('a', function () {
      throw new Error();
    });
    h.addListener('a', spy);

    h.emit('a');

    sinon.assert.calledOnce(spy);
  });

  it('yields error from filter', function () {
    var error = new Error();
    h.addFilter('a', function () {
      throw error;
    });

    var spy = sinon.spy();
    h.emit('a', spy);

    sinon.assert.calledWith(spy, error);
  });

  it('yields error from listener', function () {
    var error = new Error();
    h.addListener('a', function () {
      throw error;
    });

    var spy = sinon.spy();
    h.emit('a', spy);

    sinon.assert.calledWith(spy, error);
  });

  it('passes error from listener back to filter', function () {
    var error = new Error();
    h.addListener('a', function () {
      throw error;
    });
    var spy = sinon.spy();
    h.addFilter('a', function (next) {
      next(spy);
    });

    h.emit('a');

    sinon.assert.calledWith(spy, error);
  });

  it('passes callback value from listener back to filter', function () {
    h.addListener('a', function (callback) {
      callback(null, 42);
    });
    var spy = sinon.spy();
    h.addFilter('a', function (next) {
      next(spy);
    });

    h.emit('a');

    sinon.assert.calledWith(spy, null, 42);
  });

  it('passes arguments as this.args to filters', function () {
    var spy = sinon.spy();
    h.addFilter('a', spy);

    h.emit('a', 123, 'abc');

    sinon.assert.calledOn(spy, sinon.match.has('args', [123, 'abc']));
  });

  it('passes arguments to listeners', function () {
    var spy = sinon.spy();
    h.addListener('a', spy);

    h.emit('a', 123, 'abc');

    sinon.assert.calledWith(spy, 123, 'abc');
  });

  it('uses modified args from filter for listeners', function () {
    h.addFilter('a', function () {
      this.args.push(42, 'ab');
    });
    var spy = sinon.spy();
    h.addListener('a', spy);

    h.emit('a');

    sinon.assert.calledWith(spy, 42, 'ab');
  });

});
