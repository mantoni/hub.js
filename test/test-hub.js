var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


test('hub.create', {

  'should create instance of Hub': function () {
    assert(hub.create() instanceof hub.Hub);
  }

});
