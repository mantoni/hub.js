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
TestCase("DoesTest", {
	
	"test should be object": function () {
		assertObject(hub.does);
	}
	
});

(function () {

	function testsFor(method) {
		return {
			"test should be function": function () {
				assertFunction(hub.does[method]);
			},

			"test should return function": function () {
				assertFunction(hub.does[method]());
			},

			"test should invoke hub implementation": sinon.test(function () {
				this.stub(hub, method);
				var f = hub.does[method]("x.y", 123, "test");

				f();

				sinon.assert.calledOnce(hub[method]);
				sinon.assert.calledWith(hub[method], "x.y", 123, "test");
			}),

			"test should concat parameters": sinon.test(function () {
				this.stub(hub, method);
				var f = hub.does[method]("x.y");

				f(123, "test");

				sinon.assert.calledWith(hub[method], "x.y", 123, "test");
			}),

			"test should return result from hub implementation": sinon.test(
				function () {
					this.stub(hub, method).returns("foo");
					var f = hub.does[method]();

					var result = f();

					assertEquals("foo", result);
				}
			)
		};
	}
	
	TestCase("DoesEmitTest", testsFor("emit"));
	TestCase("DoesOnTest", testsFor("on"));
	TestCase("DoesUnTest", testsFor("un"));
	TestCase("DoesCreateTest", testsFor("create"));
	TestCase("DoesFactoryTest", testsFor("factory"));
	TestCase("DoesPeerTest", testsFor("peer"));
	
}());
