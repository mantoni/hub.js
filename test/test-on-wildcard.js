var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


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
  }


});
