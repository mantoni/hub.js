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


function unsubscribeTests(method) {
  return {

    before: function () {
      this.hub = hub();
    },

    'unsubscribes after first emit': function () {
      var spy = sinon.spy();

      this.hub[method]('test', spy);
      this.hub.emit('test');
      this.hub.emit('test');

      sinon.assert.calledOnce(spy);
    },

    'does not invoke listener again if it emits same event': function () {
      var self = this;
      var spy  = sinon.spy(function () {
        self.hub.emit('a');
      });

      this.hub[method]('a', spy);
      assert.doesNotThrow(function () {
        self.hub.emit('a');
      });

      sinon.assert.calledOnce(spy);
    },

    'does not invoke listener again if it emits same wildcard event':
      function () {
        var self = this;
        var spy  = sinon.spy(function () {
          self.hub.emit('a.b.c');
        });

        this.hub[method]('a.**', spy);
        assert.doesNotThrow(function () {
          self.hub.emit('a.b.c');
        });

        sinon.assert.calledOnce(spy);
      },

    'does not add additional listeners': function () {
      this.hub[method]('test', function () {});

      assert.equal(this.hub.listeners('test').length, 1);
    }

  };
}

function argumentsTests(method) {
  return {

    before: function () {
      this.hub = hub();
    },

    'passes arguments': function () {
      var spy = sinon.spy();

      this.hub[method]('test', spy);
      this.hub.emit('test', 'abc', 123);

      sinon.assert.calledWith(spy, 'abc', 123);
    },

    'works with callbacks': function () {
      var spy = sinon.spy();

      this.hub[method]('test', function (a, b, callback) {
        callback(null, a + b);
      });
      this.hub.emit('test', 'a', 'b', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, 'ab');
    }

  };
}


test('hub.once unsubscribe', unsubscribeTests('once'));
test('hub.once arguments', argumentsTests('once'));


function testObject(method) {

  return {

    before: function () {
      this.hub = hub();
    },

    'registers event-function pair': function () {
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      this.hub[method]({
        'a' : listener1,
        'b' : listener2
      });
      this.hub.emit('a');
      this.hub.emit('b');

      sinon.assert.called(listener1);
      sinon.assert.called(listener2);
    },

    'registers event-function pair with prefix': function () {
      var listener1 = sinon.spy();
      var listener2 = sinon.spy();

      this.hub[method]('test', {
        'a' : listener1,
        'b' : listener2
      });
      this.hub.emit('test.a');
      this.hub.emit('test.b');

      sinon.assert.called(listener1);
      sinon.assert.called(listener2);
    },

    'registers function from prototype': function () {
      function Type() {}
      Type.prototype.test = sinon.spy();
      var type = new Type();

      this.hub[method](type);
      this.hub.emit('test');

      sinon.assert.called(type.test);
    },

    'registers function from prototype with prefix': function () {
      function Type() {}
      Type.prototype.test = sinon.spy();
      var type = new Type();

      this.hub[method]('a', type);
      this.hub.emit('a.test');

      sinon.assert.called(type.test);
    },

    'does not throw if called with non function values': function () {
      var hub = this.hub;

      assert.doesNotThrow(function () {
        hub[method]({
          'a' : 'x',
          'b' : 123,
          'c' : true,
          'd' : {},
          'e' : new Date()
        });
        hub.emit('a');
        hub.emit('b');
        hub.emit('c');
        hub.emit('d');
        hub.emit('e');
      });
    },

    'does not throw if called with non function values with prefix':
      function () {
        var hub = this.hub;

        assert.doesNotThrow(function () {
          hub[method]('test', {
            'a' : 'x',
            'b' : 123,
            'c' : true,
            'd' : {},
            'e' : new Date()
          });
          hub.emit('test.a');
          hub.emit('test.b');
          hub.emit('test.c');
          hub.emit('test.d');
          hub.emit('test.e');
        });
      }

  };

}

test('hub.once object', testObject('once'));

