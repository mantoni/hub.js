/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it, beforeEach, afterEach*/
'use strict';

var assert = require('assert');
var sinon  = require('sinon');
var hub    = require('../lib/hub');


describe('removeAll', function () {
  var h;

  beforeEach(function () {
    h = new hub.Hub();
    sinon.stub(h, 'removeAllFilters');
    sinon.stub(h, 'removeAllListeners');
  });

  afterEach(function () {
    h.removeAllFilters.restore();
    h.removeAllListeners.restore();
  });

  it('removes all filters and listeners', function () {
    h.removeAll();

    sinon.assert.calledOnce(h.removeAllFilters);
    sinon.assert.calledOnce(h.removeAllListeners);
  });

  it('removes all filters and listeners for the given event', function () {
    h.removeAll('test');

    sinon.assert.calledOnce(h.removeAllFilters);
    sinon.assert.calledWith(h.removeAllFilters, 'test');
    sinon.assert.calledOnce(h.removeAllListeners);
    sinon.assert.calledWith(h.removeAllListeners, 'test');
  });

});
