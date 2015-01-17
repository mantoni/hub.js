/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
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
    h = new hub.Hub();
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

    h.emit('a', function () { return; });

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

  it('throws error from filter', function () {
    h.addFilter('a', function () {
      throw new Error();
    });

    assert.throws(function () {
      h.emit('a');
    }, Error);
  });

  it('throws error from listener', function () {
    h.addListener('a', function () {
      throw new Error();
    });

    assert.throws(function () {
      h.emit('a');
    }, Error);
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

  it('returns result array if allResults is set to true', function () {
    h.addListener('a', function () {
      return 'x';
    });
    h.addListener('a', function () {
      return 'y';
    });

    var spy = sinon.spy();
    h.emit({ event : 'a', allResults : true }, spy);

    sinon.assert.calledWith(spy, null, ['x', 'y']);
  });

  it('does not invoke filter matchers if excluded', function () {
    var spy = sinon.spy();
    h.addFilter('*', spy);

    h.emit({ event : 'a', matchers : false });

    sinon.assert.notCalled(spy);
  });

  it('does not invoke listener matchers if excluded', function () {
    var spy = sinon.spy();
    h.addListener('*', spy);

    h.emit({ event : 'a', matchers : false });

    sinon.assert.notCalled(spy);
  });

  it('does not invoke filter if only matchers', function () {
    var spy = sinon.spy();
    h.addFilter('a', spy);

    h.emit({ event : 'a', listeners : false });

    sinon.assert.notCalled(spy);
  });

  it('does not invoke listener if only matchers', function () {
    var spy = sinon.spy();
    h.addListener('a', spy);

    h.emit({ event : 'a', listeners : false });

    sinon.assert.notCalled(spy);
  });

  it('passes arbitrary properties to listeners in scope', function () {
    var muchFeature;
    h.addListener('a', function () {
      muchFeature = this.muchFeature;
    });

    h.emit({ event : 'a', muchFeature : 'such wow!' });

    assert.equal(muchFeature, 'such wow!');
  });

});
