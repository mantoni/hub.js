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
TestCase("HubDoesClassTest", {
	
	"test should be function": function () {
		assertFunction(hub.Does);
	},
	
	"test should implement methods": function () {
		assertFunction(hub.Does.prototype.emit);
		assertFunction(hub.Does.prototype.on);
		assertFunction(hub.Does.prototype.un);
		assertFunction(hub.Does.prototype.create);
		assertFunction(hub.Does.prototype.factory);
		assertFunction(hub.Does.prototype.peer);
		assertFunction(hub.Does.prototype.mix);
	}
	
});

TestCase("HubDoesTest", {
	
	"test should be object": function () {
		assertObject(hub.does);
	}
	
});

TestCase("PromiseDoesTest", {
	
	"test should be object": function () {
		var promise = hub.promise();
		
		assertObject(promise.does);
	}
	
});

(function () {

	function testsFor(object, method) {
		return {
			"test should be function": function () {
				assertFunction(object.does[method]);
			},

			"test should return function": function () {
				assertFunction(object.does[method]());
			},

			"test should invoke hub implementation": sinon.test(function () {
				this.stub(object, method);
				var f = object.does[method]("x.y", 123, "test");

				f();

				sinon.assert.calledOnce(object[method]);
				sinon.assert.calledWith(object[method], "x.y", 123, "test");
			}),

			"test should concat arguments": sinon.test(function () {
				this.stub(object, method);
				var f = object.does[method]("x.y");

				f(123, "test");

				sinon.assert.calledWith(object[method], "x.y", 123, "test");
			}),

			"test should return result from hub implementation": sinon.test(
				function () {
					this.stub(object, method).returns("foo");
					var f = object.does[method]();

					var result = f();

					assertEquals("foo", result);
				}
			)
		};
	}
	
	TestCase("HubDoesEmitTest", testsFor(hub, "emit"));
	TestCase("HubDoesOnTest", testsFor(hub, "on"));
	TestCase("HubDoesUnTest", testsFor(hub, "un"));
	TestCase("HubDoesCreateTest", testsFor(hub, "create"));
	TestCase("HubDoesFactoryTest", testsFor(hub, "factory"));
	TestCase("HubDoesPeerTest", testsFor(hub, "peer"));
	TestCase("HubDoesMixTest", testsFor(hub, "mix"));
	
	TestCase("PromiseDoesEmitTest", testsFor(hub.promise(), "emit"));
	TestCase("PromiseDoesOnTest", testsFor(hub.promise(), "on"));
	TestCase("PromiseDoesUnTest", testsFor(hub.promise(), "un"));
	TestCase("PromiseDoesCreateTest", testsFor(hub.promise(), "create"));
	TestCase("PromiseDoesFactoryTest", testsFor(hub.promise(), "factory"));
	TestCase("PromiseDoesPeerTest", testsFor(hub.promise(), "peer"));
	TestCase("PromiseDoesMixTest", testsFor(hub.promise(), "mix"));

	TestCase("NodeDoesEmitTest", testsFor(hub.node(), "emit"));
	TestCase("NodeDoesOnTest", testsFor(hub.node(), "on"));
	TestCase("NodeDoesUnTest", testsFor(hub.node(), "un"));
	TestCase("NodeDoesCreateTest", testsFor(hub.node(), "create"));
	TestCase("NodeDoesPeerTest", testsFor(hub.node(), "peer"));
	
}());
