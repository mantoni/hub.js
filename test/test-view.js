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
var sinon  = require('sinon');

var hub    = require('../lib/hub');


function testHandler(method) {
  return function () {
    var stub      = sinon.stub(this.hub, method);
    var view      = this.hub.view('test');
    var callback  = function () {};

    view[method]('abc', callback);

    sinon.assert.calledOnce(stub);
    sinon.assert.calledWith(stub, 'test.abc', callback);
  };
}


function testMultiple(method) {
  return function () {
    var stub      = sinon.stub(this.hub, method);
    var view      = this.hub.view('test');
    var callback1 = function () {};
    var callback2 = function () {};
    var callback3 = function () {};

    view[method]({
      'a' : callback1,
      'b' : callback2,
      'c' : callback3
    });

    sinon.assert.calledThrice(stub);
    sinon.assert.calledWith(stub, 'test.a', callback1);
    sinon.assert.calledWith(stub, 'test.b', callback2);
    sinon.assert.calledWith(stub, 'test.c', callback3);
  };
}


test('hub.view', {

  before: function () {
    this.hub = hub();
  },

  'should require a namespace': function () {
    try {
      this.hub.view();
      assert.fail('Exception expected');
    } catch (e) {
      assert.equal(e.name, 'TypeError');
      assert.equal(e.message, 'namespace must be a string');
    }
  },

  'should return object': function () {
    var view = this.hub.view('test');

    assert.equal(Object.prototype.toString.call(view), '[object Object]');
  },

  'should have a nice toString implementation': function () {
    var view = this.hub.view('test.me.*');

    assert.equal(view.toString(), '[object hub.View(test.me.*)]');
  },

  'should forward emit': function () {
    var stub      = sinon.stub(this.hub, 'emit');
    var view      = this.hub.view('test');
    var callback  = function () {};

    view.emit('abc', 123, 'xyz', callback);

    sinon.assert.calledOnce(stub);
    sinon.assert.calledOn(stub, this.hub);
    sinon.assert.calledWith(stub, 'test.abc', 123, 'xyz', callback);
  },

  'should forward emit object': function () {
    var stub      = sinon.stub(this.hub, 'emit');
    var view      = this.hub.view('test');
    var callback  = function () {};

    view.emit({ event : 'abc', allResults : true }, 123, 'xyz', callback);

    sinon.assert.calledOnce(stub);
    sinon.assert.calledOn(stub, this.hub);
    sinon.assert.calledWith(stub, { event : 'test.abc', allResults : true },
        123, 'xyz', callback);
  },

  'should forward on'   : testHandler('on'),
  'should forward un'   : testHandler('un'),
  'should forward once' : testHandler('once'),

  'should forward multiple on'   : testMultiple('on'),
  'should forward multiple un'   : testMultiple('un'),
  'should forward multiple once' : testMultiple('once'),

  'should forward view': function () {
    var view      = this.hub.view('test');
    var spy       = sinon.spy(this.hub, 'view');

    var result    = view.view('abc');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'test.abc');
    assert.strictEqual(result, spy.firstCall.returnValue);
  },

  'should provide addListener as an alias for on': function () {
    var view = this.hub.view('test');

    assert.strictEqual(view.addListener, view.on);
  },

  'should provide removeListener as an alias for un': function () {
    var view = this.hub.view('test');

    assert.strictEqual(view.removeListener, view.un);
  },

  'should forward removeAllListeners without event': function () {
    var stub  = sinon.stub(this.hub, 'removeAllMatching');
    var view  = this.hub.view('test');

    view.removeAllListeners();

    sinon.assert.calledOnce(stub);
    sinon.assert.calledWith(stub, 'test.**');
  },

  'should forward removeAllListeners with event': function () {
    var stub  = sinon.stub(this.hub, 'removeAllListeners');
    var view  = this.hub.view('test');

    view.removeAllListeners('abc');

    sinon.assert.calledOnce(stub);
    sinon.assert.calledWith(stub, 'test.abc');
  },

  'should forward removeAllMatching': function () {
    var stub  = sinon.stub(this.hub, 'removeAllMatching');
    var view  = this.hub.view('test');

    view.removeAllMatching('abc');

    sinon.assert.calledOnce(stub);
    sinon.assert.calledWith(stub, 'test.abc');
  },

  'should expose hub': function () {
    var view = this.hub.view('test');

    assert.strictEqual(view.hub, this.hub);
  },

  'should expose namespace': function () {
    var view = this.hub.view('test');

    assert.strictEqual(view.namespace, 'test');
  },

  'should not create new functions for each view': function () {
    var viewA = this.hub.view('a');
    var viewB = this.hub.view('b');

    assert.strictEqual(viewA.emit, viewB.emit);
    assert.strictEqual(viewA.once, viewB.once);
    assert.strictEqual(viewA.on, viewB.on);
    assert.strictEqual(viewA.un, viewB.un);
    assert.strictEqual(viewA.view, viewB.view);
    assert.strictEqual(viewA.removeAllListeners, viewB.removeAllListeners);
  }

});
