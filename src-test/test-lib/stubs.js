/*
 * Creates a stub function that sets the "called" property to true on itself
 * when invoked.
 */
function stubFn() {
	return function() {
		arguments.callee.called = true;
	};
}
