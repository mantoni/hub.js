/*
 * Test cases for Hub.multiChain.
 */
TestCase("MultiChainTest", {
	
	setUp: function() {
		this.condition = stubFn(0);
	},
	
	tearDown: function() {
		Hub.reset();
	},
	
	createChain: function() {
		return Hub.multiChain(this.condition,
			Array.prototype.slice.call(arguments));
	},
	
	"test method exists": function() {
		assertFunction(Hub.multiChain);
	},
	
	"test returns chain": function() {
		var chain = Hub.multiChain(Hub.noop);
		assertFunction(chain);
		assertFunction(chain.add);
		assertFunction(chain.remove);
		assertFunction(chain.get);
		assertFunction(chain.size);
	},
	
	"test first argument should be function": function() {
		assertException(function() {
			Hub.multiChain([]);
		});
	},
	
	"test invocation calls all given chains": function() {
		var fn1 = stubFn();
		var fn2 = stubFn();
		this.createChain(fn1, fn2)();
		assert(fn1.called);
		assert(fn2.called);
	},
	
	"test arguments are passed on": function() {
		var fn = stubFn();
		this.createChain(fn)("hello", "args");
		assertEquals({0: "hello", 1: "args"}, fn.args);
	},
	
	"test return value is returned": function() {
		assertEquals("value", this.createChain(stubFn("value"))());
	},
	
	"test return values get merged": function() {
		var fn1 = stubFn(["a"]);
		var fn2 = stubFn(["b"]);
		assertEquals(["a", "b"], this.createChain(fn1, fn2)());
	},
	
	"test Hub.stopPropagation": function() {
		var fn = stubFn();
		this.createChain(Hub.chain(function() {
			Hub.stopPropagation();
		}), fn)();
		assertFalse(fn.called);
	},
	
	"test add uses conditional": function() {
		var chain = this.createChain(Hub.chain());
		chain.add(Hub.noop, "foo");
		assert(this.condition.called);
	},
	
	"test remove uses conditional": function() {
		var chain = this.createChain(Hub.chain(Hub.noop));
		chain.remove(Hub.noop, "foo");
		assert(this.condition.called);
	},

	"test get uses conditional": function() {
		var chain = this.createChain(Hub.chain());
		chain.get(0, "foo");
		assert(this.condition.called);
	},
	
	"test size uses conditional": function() {
		var chain = this.createChain(Hub.chain());
		chain.size("foo");
		assert(this.condition.called);
	},
	
	"test add returns chain": function() {
		var chain = this.createChain(Hub.chain());
		assertSame(chain, chain.add(Hub.noop, "foo"));
	},
	
	"test initial chains": function() {
		var fn = stubFn();
		var chain = this.createChain(Hub.chain(fn));
		assertSame(fn, chain.get(0, "foo"));
	},
	
	"test get with unknown property name throws exception": function() {
		var chain = this.createChain(Hub.chain(Hub.noop));
		assertException(function() {
			Hub.multiChain(Hub.noop).get(0, "unknown");
		});
	},
	
	"test get with too large index throws exception": function() {
		var chain = this.createChain();
		assertException(function() {
			chain.get(0, 0);
		});
	},
	
	"test size returns size of chain for given property": function() {
		var chain = this.createChain(Hub.chain(Hub.noop));
		assertEquals(1, chain.size(0));
	},
	
	"test remove reduces size of underlying chain": function() {
		var fn = stubFn();
		var subChain = Hub.chain(Hub.noop, fn);
		var chain = this.createChain(subChain);
		chain.remove(fn, "foo");
		assertEquals(1, subChain.size());
	},
	
	"test add increases size of underlying chain": function() {
		var subChain = Hub.chain(Hub.noop);
		var chain = this.createChain(subChain);
		chain.add(stubFn(), "foo");
		assertEquals(2, subChain.size());
	},
	
	"test implements getChain": function() {
		assertFunction(Hub.multiChain(Hub.noop).getChain);
	},
	
	"test getChain returns chain by index": function() {
		var fn1 = stubFn();
		var fn2 = stubFn();
		var chain = Hub.multiChain(Hub.noop, [fn1, fn2]);
		assertSame(fn1, chain.getChain(0));
		assertSame(fn2, chain.getChain(1));
	}
	
});