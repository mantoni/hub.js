/*
 * hub.js
 *
 * Copyright (c) 2012-2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
/*global describe, it, beforeEach*/
'use strict';

var assert = require('assert');
var sinon  = require('sinon');
var hub    = require('../lib/hub');


describe('events', function () {
  var h;

  beforeEach(function () {
    h = new hub.Hub();
  });

  it('emits "newFilter"', function () {
    var f = sinon.spy();
    var s = sinon.spy();
    h.addListener('newFilter', s);

    h.addFilter('test', f);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, 'test', f);
  });

  it('emits "removeFilter"', function () {
    var f = sinon.spy();
    var s = sinon.spy();
    h.addListener('removeFilter', s);

    h.addFilter('test', f);
    h.removeFilter('test', f);

    sinon.assert.calledOnce(s);
    sinon.assert.calledWith(s, 'test', f);
  });

});
