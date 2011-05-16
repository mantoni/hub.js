/*globals hub stubFn TestCase fail assert assertFalse assertNull assertNotNull
	assertUndefined assertNotUndefined assertSame assertNotSame assertEquals
	assertFunction assertObject assertArray assertException assertNoException
*/
/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
/*
 * Test cases for hub.mix.
 */
TestCase("MixTest", {
	
	"test should be function": function() {
		assertFunction(hub.mix);
	},
	
	"test should assign function": function() {
		var object = {};
		var fn = stubFn();
		
		hub.mix(object, { test: fn });
		
		assertSame(fn, object.test);
	},
	
	"test should not assign property": function() {
		var object = {};
		
		hub.mix(object, { test: 123 });
		
		assertUndefined(object.test);
	},
	
	"test should create chain on override": function() {
		var fn1 = stubFn();
		var fn2 = stubFn();
		var object = {
			test: fn1
		};
		
		hub.mix(object, { test: fn2 });

		assertFunction(object.test.add);
	},
	
	"test should return first argument": function() {
		var first = {};
		var second = {};
		
		var result = hub.mix(first, second);
		
		assertSame(first, result);
	}
	
});