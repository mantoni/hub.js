/**
 * hub.js
 *
 * Copyright (c) 2012 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


function testCases(event) {
  return {

    before: function () {
      this.hub = hub();
    },


    'should return function': function () {
      var result;

      this.hub.on(event, function () {
        result = this.callback();
      });
      this.hub.emit('test');

      assert.equal(typeof result, 'function');
    },


    'should resolve with value': function () {
      var spy = sinon.spy();

      this.hub.on(event, function () {
        var callback = this.callback();
        callback(null, 'value');
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, 'value');
    },


    'should resolve with error': function () {
      var spy = sinon.spy();
      var err = new Error();

      this.hub.on(event, function () {
        var callback = this.callback();
        callback(err);
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, err);
    },


    'should add value with callback.push': function () {
      var spy = sinon.spy();

      this.hub.on(event, function () {
        this.callback.push('a');
        this.callback.push('b');
      });
      this.hub.emit('test', hub.CONCAT, spy);

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWith(spy, null, ['a', 'b']);
    },


    'should add error with callback.err': function () {
      var spy = sinon.spy();
      var err1 = new Error();
      var err2 = new Error();

      this.hub.on(event, function () {
        this.callback.err(err1);
        this.callback.err(err2);
      });
      this.hub.emit('test', spy);

      sinon.assert.calledOnce(spy);
      assert.deepEqual(spy.firstCall.args[0].name, "ErrorList");
      assert.deepEqual(spy.firstCall.args[0].errors, [err1, err2]);
      /*
      sinon.assert.calledWith(spy, sinon.match({
        name    : 'ErrorList',
        errors  : [err1, err2]
      }));
      */
    }

  };
}

test('this.callback matcher', testCases('*'));
test('this.callback listener', testCases('test'));
