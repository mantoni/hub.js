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


function scopeForEvent(hub, event) {
  var scope;
  hub.emit(event, function () {
    scope = this;
  });
  return scope;
}


test('this', {

  before: function () {
    this.hub = hub();
  },


  'should be a View instance': function () {
    var scope = scopeForEvent(this.hub, 'some.test');

    assert(scope instanceof hub.View);
  },


  'should a namspace one level up': function () {
    var scope = scopeForEvent(this.hub, 'some.fancy.test');

    assert.equal(scope.namespace, 'some.fancy');
  },


  'should alias hub functions': function () {
    var scope = scopeForEvent(this.hub, 'test');

    assert.strictEqual(scope.once, this.hub.once);
    assert.strictEqual(scope.on, this.hub.on);
    assert.strictEqual(scope.un, this.hub.un);
    assert.strictEqual(scope.before, this.hub.before);
    assert.strictEqual(scope.after, this.hub.after);
    assert.strictEqual(scope.removeAllListeners, this.hub.removeAllListeners);
    assert.strictEqual(scope.view, this.hub.view);
  },


  'should not be hub': function () {
    var scope = scopeForEvent(this.hub, 'test');

    assert.notStrictEqual(scope, this.hub);
  }

});
