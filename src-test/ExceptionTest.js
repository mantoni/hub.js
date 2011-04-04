/*
 * Test cases for exceptions.
 */
TestCase("ExceptionTest", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	"test throw in subscriber": function() {
		Hub.subscribe("test/throw", function() {
			throw new Error();
		});
		assertException(function() {
			Hub.publish("test/throw");
		});
	},
	
	"test promise rejected": function() {
		Hub.subscribe("test/throw", function() {
			Hub.promise();
			throw new Error();
		});
		var f = stubFn();
		Hub.publish("test/throw").then(function() {
			fail("Unexpected success");
		}, f);
		assert(f.called);
	}

});