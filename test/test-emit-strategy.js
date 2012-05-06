var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');
var strategy  = require('../lib/strategy');


test('emit-strategy', {

  before: function () {
    this.hub = hub();
  },


  'should use LAST by default': sinon.test(function () {
    this.spy(strategy, 'LAST');
    this.hub.on('test', sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(strategy.LAST);
    sinon.assert.calledWith(strategy.LAST, ['a', 'b']);
    sinon.assert.calledWith(spy, null, 'b');
  }),


  'should use LAST by default with wildcards': sinon.test(function () {
    this.spy(strategy, 'LAST');
    this.hub.on('*', sinon.stub().returns('a'));
    this.hub.on('*', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(strategy.LAST);
    sinon.assert.calledWith(strategy.LAST, ['a', 'b']);
    sinon.assert.calledWith(spy, null, 'b');
  }),


  'should use given strategy with return values': sinon.test(function () {
    this.spy(strategy, 'CONCAT');
    this.hub.on('test', sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', strategy.CONCAT, spy);

    sinon.assert.calledOnce(strategy.CONCAT);
    sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }),


  'should use given strategy with return values and wildcards': sinon.test(
    function () {
      this.spy(strategy, 'CONCAT');
      this.hub.on('*', sinon.stub().returns('a'));
      this.hub.on('*', sinon.stub().returns('b'));
      var spy = sinon.spy();

      this.hub.emit('test', strategy.CONCAT, spy);

      sinon.assert.calledOnce(strategy.CONCAT);
      sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    }
  ),


  'should use given strategy with callback values': sinon.test(function () {
    this.spy(strategy, 'CONCAT');
    this.hub.on('test', function (callback) {
      callback(null, 'a');
    });
    this.hub.on('test', function (callback) {
      callback(null, 'b');
    });
    var spy = sinon.spy();

    this.hub.emit('test', strategy.CONCAT, spy);

    sinon.assert.calledOnce(strategy.CONCAT);
    sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
    sinon.assert.calledWith(spy, null, ['a', 'b']);
  }),


  'should use given strategy with callback values and wildcards': sinon.test(
    function () {
      this.spy(strategy, 'CONCAT');
      this.hub.on('*', function (callback) {
        callback(null, 'a');
      });
      this.hub.on('*', function (callback) {
        callback(null, 'b');
      });
      var spy = sinon.spy();

      this.hub.emit('test', strategy.CONCAT, spy);

      sinon.assert.calledOnce(strategy.CONCAT);
      sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    }
  ),


  'should use given strategy with callback and return value': sinon.test(
    function () {
      this.spy(strategy, 'CONCAT');
      this.hub.on('test', function (callback) {
        setTimeout(function () {
          callback(null, 'a');
        }, 10);
      });
      this.hub.on('test', function () {
        return 'b';
      });
      var spy = sinon.spy();

      this.hub.emit('test', strategy.CONCAT, spy);
      this.clock.tick(10);

      sinon.assert.calledOnce(strategy.CONCAT);
      sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    }
  ),


  'should use given strategy with callback and return value and wildcards':
    sinon.test(function () {
      this.spy(strategy, 'CONCAT');
      this.hub.on('*', function (callback) {
        setTimeout(function () {
          callback(null, 'a');
        }, 10);
      });
      this.hub.on('*', function () {
        return 'b';
      });
      var spy = sinon.spy();

      this.hub.emit('test', strategy.CONCAT, spy);
      this.clock.tick(10);

      sinon.assert.calledOnce(strategy.CONCAT);
      sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    }),


  'should mix wildcard and non-wildcard results': sinon.test(function () {
    this.spy(strategy, 'CONCAT');
    this.hub.on('*', sinon.stub().returns('a'));
    this.hub.on('test', sinon.stub().returns('b'));
    var spy = sinon.spy();

    this.hub.emit('test', strategy.CONCAT, spy);

    sinon.assert.calledOnce(strategy.CONCAT);
    sinon.assert.calledWith(strategy.CONCAT, ['a', 'b']);
    sinon.assert.calledWith(spy, null, ['a', 'b']);    
  })


});
