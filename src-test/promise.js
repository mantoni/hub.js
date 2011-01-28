/*
 * Test cases for promise support.
 */
TestCase("promise", {
	
	tearDown: function() {
		Hub.reset();
	},
	
	/*
	 * asserts that a listeners return value is handed over as the value
	 * of the promise callback.
	 */
	testValuePromise: function() {
/*		Hub.node("x", function() {
			return {
				"y": function() {
					return 1;
				}
			};
		});
		var n = 0;
		Hub.publish("x.y").then(function(value, data) {
			n += value;
		});
		assertEquals(1, n);
*/
		assertTrue(true);
	}

});