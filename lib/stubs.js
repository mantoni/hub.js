/*
 * Creates a stub function that sets the "called" property to true on itself
 * when invoked.
 */
function stubFn(returnValue) {
	var fn = function() {
		var callee = arguments.callee;
		callee.called = true;
		callee.args = arguments;
		return returnValue;
	};
	fn.called = false;
	return fn;
}
