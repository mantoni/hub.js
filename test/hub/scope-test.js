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
 * Test cases for hub.scope.
 */
TestCase("ScopeTest", {

	"test should be function": function () {
		assertFunction(hub.scope);
	},

	"test should implement stopPropagation": function () {
		var scope = hub.scope();

		assertFunction(scope.stopPropagation);
	},

	"test should implement propagate": function () {
		var scope = hub.scope();

		assertFunction(scope.propagate);
	},

	"test should implement aborted": function () {
		var scope = hub.scope();

		assertFunction(scope.aborted);
	},

	"test should implement result": function () {
		var scope = hub.scope();

		assertFunction(scope.result);
	},

	"test should implement promise": function () {
		var scope = hub.scope();

		assertFunction(scope.promise);
	},

	"test aborted should return false by default": function () {
		var aborted;
		var chain = hub.chain(function () {
			aborted = this.aborted();
		});

		chain();

		assertFalse(aborted);
	},

	"test aborted should return true after stopPropagation": function () {
		var aborted;
		var chain = hub.chain(function () {
			this.stopPropagation();
			aborted = this.aborted();
		});

		chain();

		assert(aborted);
	},

	"test promise should invoke hub.promise": sinon.test(function () {
		var spy = this.spy(hub, "promise");
		var result;
		var chain = hub.chain(function () {
			result = this.promise();
		});

		chain();

		sinon.assert.calledOnce(spy);
		assertSame(spy.returnValues[0], result);
	}),

	"test this.promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				promise = this.promise();
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test return promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				return (promise = hub.promise());
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test return this.promise should stop chain execution until resolved":
		function () {
			var spy = sinon.spy();
			var promise;
			var chain = hub.chain(function () {
				return (promise = this.promise());
			}, spy);

			chain();

			sinon.assert.notCalled(spy);

			promise.resolve();

			sinon.assert.calledOnce(spy);
		},

	"test chain result should be promise": function () {
		var chain = hub.chain(function () {
			this.promise();
		});

		var promise = chain();

		assertObject(promise);
		assertFunction(promise.then);
	}

});
