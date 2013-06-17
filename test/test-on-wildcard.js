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
var sinon   = require('sinon');

var hub     = require('../lib/hub');


test('hub.on wildcard', {

  before: function () {
    this.hub = hub();
  },


  'should subscribe to matching events': function () {
    var spy = sinon.spy();

    this.hub.on('test.*', spy);
    this.hub.emit('test.a');
    this.hub.emit('test.b');

    sinon.assert.calledTwice(spy);
  },


  'should be invoked on single star broadcast': function () {
    var spy = sinon.spy();

    this.hub.on('foo.*', spy);
    this.hub.emit('*.bar');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked on double star broadcast': function () {
    var spy = sinon.spy();

    this.hub.on('foo.**', spy);
    this.hub.emit('**.bar');

    sinon.assert.calledOnce(spy);
  },


  'should not emit to not matching events': function () {
    var spy = sinon.spy();

    this.hub.on('foo.*', spy);
    this.hub.emit('bar.x');

    sinon.assert.notCalled(spy);
  },


  'should emit to matcher and exact match': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test.*', spy1);
    this.hub.on('test.a', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should subscribe twice to same matcher': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('test.*', spy1);
    this.hub.on('test.*', spy2);
    this.hub.emit('test.a');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'should receive arguments from emit': function () {
    var spy = sinon.spy();
    var arr = ['a', 'b'];

    this.hub.on('*', spy);
    this.hub.emit('test', 1, 'x', arr);

    sinon.assert.calledWith(spy, 1, 'x', arr);
  },


  'should stop at dot at end': function () {
    var spy = sinon.spy();

    this.hub.on('test.*', spy);
    this.hub.emit('test.a.b');

    sinon.assert.notCalled(spy);
  },


  'should stop at dot at start': function () {
    var spy = sinon.spy();

    this.hub.on('*.test', spy);
    this.hub.emit('a.b.test');

    sinon.assert.notCalled(spy);
  },


  'should work with multiple wildcards': function () {
    var spy = sinon.spy();

    this.hub.on('a.*.c.*.e', spy);
    this.hub.emit('a.b.c.d.e');

    sinon.assert.calledOnce(spy);
  },


  'should not stop at dot': function () {
    var spy = sinon.spy();

    this.hub.on('test.**', spy);
    this.hub.emit('test.a.b');

    sinon.assert.calledOnce(spy);
  },


  'should work with multiple double wildcards': function () {
    var spy = sinon.spy();

    this.hub.on('**.test.**', spy);
    this.hub.emit('a.b.test.c.d');

    sinon.assert.calledOnce(spy);
  },


  'should invoke **.bar.test before *.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*.bar.*', spy2);
    this.hub.on('**.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke *.bar.* before *.bar.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*.bar.test', spy2);
    this.hub.on('*.bar.*', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke *.bar.test before foo.**': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.**', spy2);
    this.hub.on('*.bar.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke foo.** before foo.*.test': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.*.test', spy2);
    this.hub.on('foo.**', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should invoke foo.*.test before foo.bar.*': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('foo.bar.*', spy2);
    this.hub.on('foo.*.test', spy1);
    this.hub.emit('foo.bar.test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'does not invoke matcher registrated for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('*', function () {
      if (this.event !== 'newListener') {
        hub.on('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'invokes listener registered for "on" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('*', function () {
      if (this.event !== 'newListener') {
        hub.on('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes matcher registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('*', function () {
      if (this.event !== 'newListener') {
        hub.after('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.on('*', function () {
      if (this.event !== 'newListener') {
        hub.after('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'invokes listener registered after emit': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('a.*', function () {});
    hub.emit('*.*');

    hub.on('b.*', spy);
    hub.emit('*.*');

    sinon.assert.calledOnce(spy);
  }

});
