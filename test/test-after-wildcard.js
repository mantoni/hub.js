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


test('hub.after wildcard', {

  before: function () {
    this.hub = hub();
  },


  'should be invoked on emit': function () {
    var spy = sinon.spy();

    this.hub.after('*', spy);
    this.hub.emit('test');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked on single star broadcast': function () {
    var spy = sinon.spy();

    this.hub.after('foo.*', spy);
    this.hub.emit('*.bar');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked on double star broadcast': function () {
    var spy = sinon.spy();

    this.hub.after('foo.**', spy);
    this.hub.emit('**.bar');

    sinon.assert.calledOnce(spy);
  },


  'should be invoked after on if registered before on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.after('*', spy2);
    this.hub.on('*', spy1);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked after on if registered after on': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.on('*', spy1);
    this.hub.after('*', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy1, spy2);
  },


  'should be invoked after after': function () {
    var spy1 = sinon.spy();
    var spy2 = sinon.spy();

    this.hub.after('*', spy1);
    this.hub.after('test', spy2);
    this.hub.emit('test');

    sinon.assert.callOrder(spy2, spy1);
  },


  'should be invoked with the result of on': function () {
    var spy = sinon.spy();

    this.hub.on('greet', function (name) { return 'Hello ' + name; });
    this.hub.after('*', spy);
    this.hub.emit('greet', 'cjno');

    sinon.assert.calledWith(spy, null, 'Hello cjno');
  },


  'should be invoked with the err of on': function () {
    var spy = sinon.spy();
    var err = new Error('D`oh!');

    this.hub.on('greet', sinon.stub().throws(err));
    this.hub.after('*', spy);
    this.hub.emit('greet', 'cjno', function () {});

    sinon.assert.calledWith(spy, err);
  },


  'does not invoke matcher registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.after('*', function () {
      if (this.event !== 'newListener') {
        hub.after('*', spy);
      }
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'invokes listener registered for "after" phase': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.after('*', function () {
      if (this.event !== 'newListener') {
        hub.after('test', spy);
      }
    });
    hub.emit('test');

    sinon.assert.notCalled(spy);
  },


  'emits error thrown in after': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('error', spy);

    hub.after('*', function () {
      throw 'e';
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'e');
  },


  'combines error from on with error from after': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('error', spy);

    hub.on('test', function () {
      throw '1';
    });
    hub.after('*', function () {
      throw '2';
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name   : 'ErrorList',
      errors : ['1', '2']
    });
  },


  'combines error from after listener with error from matcher': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('error', spy);

    hub.after('test', function () {
      throw '1';
    });
    hub.after('*', function () {
      throw '2';
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name   : 'ErrorList',
      errors : ['1', '2']
    });
  },


  'combines error from on and after with error from matcher': function () {
    var spy = sinon.spy();
    var hub = this.hub;
    hub.on('error', spy);

    hub.on('test', function () {
      throw '1';
    });
    hub.after('test', function () {
      throw '2';
    });
    hub.after('*', function () {
      throw '3';
    });
    hub.emit('test');

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWithMatch(spy, {
      name     : 'ErrorList',
      errors   : [sinon.match({
        name   : 'ErrorList',
        errors : ['1', '2']
      }), '3']
    });
  },


  'passes error from after listener to after matcher': function () {
    var spy = sinon.spy();
    var hub = this.hub;

    hub.after('test', function () {
      throw 'e';
    });
    hub.after('*', spy);
    hub.emit('test', function () {});

    sinon.assert.calledOnce(spy);
    sinon.assert.calledWith(spy, 'e');
  },


  'passes combined error from on and after listener to after matcher':
    function () {
      var spy = sinon.spy();
      var hub = this.hub;

      hub.on('test', function () {
        throw '1';
      });
      hub.after('test', function () {
        throw '2';
      });
      hub.after('*', spy);
      hub.emit('test', function () {});

      sinon.assert.calledOnce(spy);
      sinon.assert.calledWithMatch(spy, {
        name   : 'ErrorList',
        errors : ['1', '2']
      });
    }

});
