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


test('this.beforeReturn', {

  before: function () {
    this.hub = hub();
  },


  'should throw if no callback is given': function () {
    this.hub.on('*', function () {
      var self = this;
      
      assert.throws(function () {
        self.beforeReturn();
      }, TypeError);
      assert.throws(function () {
        self.beforeReturn(false);
      }, TypeError);
      assert.throws(function () {
        self.beforeReturn({});
      }, TypeError);
    });
    this.hub.emit('test');
  },


  'should invoke callback after emit but before return': function () {
    var emitSpy         = sinon.spy();
    var beforeReturnSpy = sinon.spy();
    var callbackSpy     = sinon.spy();
    this.hub.on('*', function () {
      this.beforeReturn(beforeReturnSpy);
    });
    this.hub.on('test', emitSpy);

    this.hub.emit('test', callbackSpy);

    sinon.assert.calledOnce(beforeReturnSpy);
    sinon.assert.callOrder(emitSpy, beforeReturnSpy, callbackSpy);
  },


  'should be invoked with null and result': function () {
    var spy = sinon.spy();
    this.hub.on('*', function () {
      this.beforeReturn(spy);
    });
    this.hub.on('test', sinon.stub().returns(1));
    this.hub.on('test', sinon.stub().returns(2));

    this.hub.emit('test', hub.CONCAT, function () {});

    sinon.assert.calledWith(spy, null, [1, 2]);
  },


  'should invoke multiple callback': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();
    this.hub.on('*', function () {
      this.beforeReturn(spy1);
    });
    this.hub.on('*', function () {
      this.beforeReturn(spy2);
    });

    this.hub.emit('test');

    sinon.assert.calledOnce(spy1);
    sinon.assert.calledOnce(spy2);
  },


  'shoult be invoked with thrown error': function () {
    var self  = this;
    var spy   = sinon.spy();
    var err   = new RangeError();
    this.hub.on('*', function () {
      this.beforeReturn(spy);
    });
    this.hub.on('test', sinon.stub().throws(err));

    assert.throws(function () {
      self.hub.emit('test');
    }, RangeError);
    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, err);
  },


  'should invoke second callback if first throws': function () {
    var error = new Error();
    var spy   = sinon.spy();
    var err;
    this.hub.on('*', function () {
      this.beforeReturn(function () {
        throw error;
      });
    });
    this.hub.on('*', function () {
      this.beforeReturn(spy);
    });

    try {
      this.hub.emit('test');
    } catch (e) {
      err = e;
    }

    assert.strictEqual(err, error);
    sinon.assert.calledOnce(spy);
  },


  'should throw error list if multiple callbacks throw': function () {
    function thrower() {
      this.beforeReturn(function () {
        throw new Error();
      });
    }
    this.hub.on('*', thrower);
    this.hub.on('*', thrower);
    var err;

    try {
      this.hub.emit('test');
    } catch (e) {
      err = e;
    }

    assert.equal(err.name, "ErrorList");
  },


  'should invoke emit callback with error if callback throws': function () {
    var error = new Error();
    var spy   = sinon.spy();
    this.hub.on('*', function () {
      this.beforeReturn(function () {
        throw error;
      });
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, error);
  },


  'should merge callback error with listener error': function () {
    var error1  = new Error();
    var error2  = new Error();
    var spy     = sinon.spy();
    this.hub.on('*', function () {
      this.beforeReturn(function () {
        throw error1;
      });
    });
    this.hub.on('test', function () {
      throw error2;
    });

    this.hub.emit('test', spy);

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name    : "ErrorList",
      errors  : [error1, error2]
    });
  }


});
