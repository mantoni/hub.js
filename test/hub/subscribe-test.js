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
 * Test cases for hub.subscribe.
 */
TestCase("SubscribeTest", {
	
	tearDown: function () {
		hub.reset();
	},
	
	"test should be function": function () {
		assertFunction(hub.subscribe);
	},
	
	"test should throw if callback is missing": function () {
		assertException(function () {
			hub.subscribe("namespace.topic");
		}, "TypeError");
	},
	
	"test should throw if topic contains illegal characters": function () {
		assertException(function () {
			hub.subscribe("namespace/topic", function () {});
		}, "Error");
	},
	
	"test subscribe invocation": function () {
		var fn = sinon.spy();
		assertNoException(function () {
			hub.subscribe("a", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.b.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.*.b.*", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.a.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("*.a.*.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("**.b", fn);
		});
		assertNoException(function () {
			hub.subscribe("a.**", fn);
		});
	},
	
	"test subscribe throws if callback is not function": function () {
		assertException(function () {
			hub.subscribe("x.y");
		});
		assertException(function () {
			hub.subscribe("x.y", null);
		});
		assertException(function () {
			hub.subscribe("x.y", true);
		});
		assertException(function () {
			hub.subscribe("x.y", {});
		});
		assertException(function () {
			hub.subscribe("x.y", []);
		});
	},
	
	"test should implement on as an alias to subscribe": function () {
		assertFunction(hub.on);
		assertSame(hub.subscribe, hub.on);
	}
	
});