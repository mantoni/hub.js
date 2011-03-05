/*
 * Test cases for Hub.subscribe.
 */
TestCase("subscribe", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	testFunctionExists: function() {
		assertFunction(Hub.subscribe);
	},
	
	testSubscribeInvocation: function() {
		assertNoException(function() {
			Hub.subscribe("a");
		});
		assertNoException(function() {
			Hub.subscribe("a/b");
		});
		assertNoException(function() {
			Hub.subscribe("a/*");
		});
		assertNoException(function() {
			Hub.subscribe("*/b");
		});
		assertNoException(function() {
			Hub.subscribe("a.*/b");
		});
		assertNoException(function() {
			Hub.subscribe("a/b.*");
		});
		assertNoException(function() {
			Hub.subscribe("a.*/b.*");
		});
		assertNoException(function() {
			Hub.subscribe("*.a/b");
		});
		assertNoException(function() {
			Hub.subscribe("*.a/*.b");
		});
		assertNoException(function() {
			Hub.subscribe("**/b");
		});
		assertNoException(function() {
			Hub.subscribe("a/**");
		});
	}

});