var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


test('hub.once', {

  before: function () {
    this.hub = hub.create();
  },


  'should unsubscribe after first emit': function () {
    var spy = sinon.spy();

    this.hub.once('test', spy);
    this.hub.emit('test');
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should pass arguments': function () {
    var spy = sinon.spy();

    this.hub.once('test', spy);
    this.hub.emit('test', 'abc', 123);

    sinon.assert.calledWith(spy, 'abc', 123);
  },


  'should work with callbacks': function () {
    var spy = sinon.spy();

    this.hub.once('test', function (a, b, callback) {
      callback(null, '=' + a + b);
    });
    this.hub.emit('test', 'a', 'b', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, null, '=ab');
  }

});
