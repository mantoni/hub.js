/**
 * hub.js
 *
 * Copyright (c) 2013 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var test      = require('utest');
var assert    = require('assert');
var sinon     = require('sinon');

var hub       = require('../lib/hub');


test('emit-options', {


  'exposes Options constructor': function () {
    assert.equal(typeof hub.Options, 'function');
  },


  'returns object of type Options': function () {
    var options = hub.options({});

    assert.equal(typeof options, 'object');
    assert(options instanceof hub.Options);
  },


  'news up Options with given object': sinon.test(function () {
    this.stub(hub, 'Options');
    var config = { allResults : true };

    hub.options(config);

    sinon.assert.calledOnce(hub.Options);
    sinon.assert.calledWithNew(hub.Options);
    sinon.assert.calledWith(hub.Options, config);
  }),


  'returns [object hub.Options] for toString': function () {
    var options = hub.options({});

    var stringified = options.toString();

    assert.equal(stringified, '[object hub.Options]');
  },


  'exposes allResults function': function () {
    var optionsWithTrue  = hub.options({ allResults : true });
    var optionsWithFalse = hub.options({ allResults : false });

    assert.strictEqual(optionsWithTrue.allResults, true);
    assert.strictEqual(optionsWithFalse.allResults, false);
  },


  'always exposes same function instance for true': function () {
    var options1 = hub.options({ allResults : true });
    var options2 = hub.options({ allResults : true });

    assert.strictEqual(options1.allResults, options2.allResults);
  },


  'always exposes same function instance for false': function () {
    var options1 = hub.options({ allResults : false });
    var options2 = hub.options({ allResults : false });

    assert.strictEqual(options1.allResults, options2.allResults);
  },


  'exposes allResults false function by default': function () {
    var options1 = hub.options({});
    var options2 = hub.options({ allResults : false });

    assert.strictEqual(options1.allResults, options2.allResults);
  },


  'does not expose random config properties': function () {
    var options = hub.options({
      foo : 'foo',
      bar : 'bar',
      doo : 'doo'
    });

    assert.strictEqual(options.foo, undefined);
    assert.strictEqual(options.bar, undefined);
    assert.strictEqual(options.doo, undefined);
  }

});
