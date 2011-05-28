/*jslint undef: true, white: true*/
/*globals hub sinon TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.forward.
 */
TestCase("ForwardTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test simple forward short": function () {
		var fn = sinon.spy();
		hub.subscribe("x.y", fn);
		hub.forward("a.b", "x.y");
		hub.publish("a.b");
		sinon.assert.calledOnce(fn);
	},
	
	"test multi forward simple": function () {
		var fn = sinon.spy();
		hub.subscribe("x.y", fn);
		hub.forward({
			"a.b": "x.y"
		});
		hub.publish("a.b");
		sinon.assert.calledOnce(fn);
	},
	
	testMultiForwardComplex: function () {
		var fn = sinon.spy();
		hub.subscribe("x.y", fn);
		hub.forward({
			"a.b": ["x.y"]
		});
		hub.publish("a.b");
		sinon.assert.calledOnce(fn);
	}

});