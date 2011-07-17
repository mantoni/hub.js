/**
 * @license hub.js JavaScript library, v0.1-SNAPSHOT
 * https://github.com/mantoni/hub.js
 * 
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
hub = {};
if (!Object.create) {
	Object.create = function (object) {
		function C() {}
		C.prototype = object;
		return new C();
	};
}

if (!Array.prototype.forEach) {
	Array.prototype.forEach = function (fn, scope) {
		if (!fn || !fn.call) {
			throw new TypeError();
		}
		var i = 0, l = this.length;
		for (; i < l; i++) {
			fn.call(scope, this[i], i, this);
		}
	};
}

hub.apply = function (name, args) {
	return this[name].apply(this, args);
};

hub.resolve = function (object, path, defaultValue) {
	var p = path.indexOf(".");
	while (p !== -1) {
		var key = path.substring(0, p);
		if (!object.hasOwnProperty(key)) {
			return defaultValue;
		}
		object = object[key];
		path = path.substring(p + 1);
		p = path.indexOf(".");
	}
	return object.hasOwnProperty(path) ? object[path] : defaultValue;
};

hub.substitute = function (string, values, defaultValue) {
	if (defaultValue === undefined) {
		defaultValue = "";
	}
	var replaceFn = values ? function (match, path) {
		return hub.resolve(values, path, defaultValue);
	} : function () {
		return defaultValue;
	};
	return string.replace(/\{([a-zA-Z0-9\.]+)\}/g, replaceFn);
};

hub.Error = function (type, description, context) {
	this.type = type;
	this.context = context;
	this.toString = function () {
		return hub.substitute(description, context);
	};
};

hub.merge = function (target, source) {
	if (target === undefined || target === null || target === source) {
		return source;
	}
	if (source === undefined || source === null) {
		return target;
	}
	var toString = Object.prototype.toString;
	var sourceType = toString.call(source);
	var targetType = toString.call(target);
	var k;
	if (targetType === sourceType) {
		if (sourceType === "[object Object]") {
			for (k in source) {
				if (source.hasOwnProperty(k)) {
					target[k] = hub.merge(target[k], source[k]);
				}
			}
			return target;
		}
		if (sourceType === "[object Array]") {
			return target.concat(source);
		}
	}
	throw new hub.Error("validation",
		targetType === sourceType ?
			"Cannot merge value {target} with {source}" :
			"Cannot merge type {targetType} with {sourceType}", {
				target: target,
				source: source,
				targetType: targetType,
				sourceType: sourceType
			}
	);
};
(function () {
	
	var array_slice = Array.prototype.slice;
	
	function does(method) {
		return function () {
			var delegate = this._;
			var type = typeof delegate[method];
			if (type !== "function") {
				throw new TypeError(method + " is " + type);
			}
			var args1 = array_slice.call(arguments);
			return function () {
				var args2 = array_slice.call(arguments);
				return delegate[method].apply(delegate, args1.concat(args2));
			};
		};
	}
	
	function define() {
		var proto = {};
		array_slice.call(arguments).forEach(function (name) {
			proto[name] = does(name);
		});
		function F(delegate) {
			this._ = delegate;
		}
		F.prototype = proto;
		return F;
	}
	var HubDoes = define("emit", "on", "un", "create", "factory", "peer",
		"mix");
	hub.does = new HubDoes(hub);
	hub.does.define = define;
	
}());
hub.iterator = function (array) {
	var index = 0;
	var length = array.length;
	
	function iterator() {
		if (index >= length) {
			throw new Error("Iterator out of bounds.");
		}
		var item = array[index++];
		iterator.hasNext = index < length;
		return item;
	}
	iterator.hasNext = index < length;
	
	iterator.remove = function remove(object) {
		var type = typeof object;
		var i;
		if (type === "undefined") {
			object = index;
		} else if (type === "number") {
			if (object < index) {
				index--;
			}
		} else {
			for (i = array.length - 1; i >= 0; i--) {
				if (array[i] === object) {
					object = i;
					break;
				}
			}
			if (i < 0) {
				return false;
			}
		}
		if (object >= length) {
			return false;
		}
		array.splice(object, 1);
		iterator.hasNext = index < --length;
		return true;
	};
	
	iterator.insert = function insert(i, element) {
		if (typeof element === "undefined") {
			element = i;
			i = index;
		} else if (i < index) {
			index++;
		}
		array.splice(i, 0, element);
		iterator.hasNext = index < ++length;
	};
	
	iterator.reset = function () {
		index = 0;
		iterator.hasNext = index < length;
	};
	
	return iterator;
};
hub.chain = function () {
	var iterator = hub.iterator(arguments.length ?
		Array.prototype.slice.call(arguments) : []);
	function callChain() {
		var thiz = this.propagate ? this : hub.scope();
		thiz.push(iterator);
		return thiz.propagate.apply(thiz, arguments);
	}
	callChain.on = function (fn) {
		var fnType = typeof fn;
		if (fnType !== "function") {
			throw new TypeError("Callback is " + fnType);
		}
		iterator.insert(0, fn);
	};
	callChain.un = iterator.remove;
	return callChain;
};	
(function () {
	
	function assertFunction(fn) {
		if (typeof fn !== "function") {
			throw new TypeError();
		}
	}
	
	function chain(object, key, fn) {
		var c = object[key];
		if (!c) {
			object[key] = hub.chain(fn);
		} else if (c.add) {
			c.add(fn);
		} else {
			object[key] = hub.chain(fn, object[key]);
		}
	}
	
	function mix(object, mixin) {
		var key;
		for (key in mixin) {
			if (mixin.hasOwnProperty(key) &&
					typeof mixin[key] === "function") {
				chain(object, key, mixin[key]);
			}
		}
		return object;
	}
	
	function create(topic, fn, args) {
		if (typeof topic !== "string") {
			args = fn;
			fn = topic;
			topic = null;
		}
		assertFunction(fn);
		var object = {};
		var scope = topic ? hub.topicScope(topic) : hub.scope();
		scope.mix = function () {
			hub.apply("emit", arguments).then(hub.does.mix(object));
		};
		var result = args ? fn.apply(scope, args) : fn.call(scope);
		return hub.mix(object, result);
	}
	
	function factory(topic, fn) {
		if (typeof topic !== "string") {
			assertFunction(topic);
		} else {
			assertFunction(fn);
		}
		return function () {
			return hub.create(topic, fn);
		};
	}
	
	hub.mix = mix;
	hub.create = create;
	hub.factory = factory;
	
}());
(function () {
	
	var NodeDoes = hub.does.define("emit", "on", "un", "create", "factory",
		"peer", "mix"
	);
	var array_slice = Array.prototype.slice;
	var function_string = "function";
	var topicPlaceholderRE = /\{([a-zA-Z0-9\.]+)\}/g;
	
	// ensures the given argument is a valid topic. Throws an error otherwise.
	function validateTopic(topic) {
		var type = typeof topic;
		if (type !== "string") {
			throw new Error("Topic is " + type);
		}
		if (!topic) {
			throw new Error("Topic is empty");
		}
		if (!(/^[a-zA-Z0-9\.\{\}\*]+$/.test(topic))) {
			throw new Error("Illegal topic: " + topic);
		}
	}
	
	function topicComparator(left, right) {
		var leftStar = left.indexOf("*");
		var rightStar = right.indexOf("*");
		if (leftStar === -1) {
			return rightStar === -1 ? 0 : 1;
		}
		if (rightStar === -1) {
			return -1;
		}
		var leftSlash = left.indexOf(".");
		var rightSlash = right.indexOf(".");
		if (leftStar < leftSlash) {
			if (rightStar > rightSlash) {
				return -1;
			}
		} else if (rightStar < rightSlash) {
			return 1;
		}
		return 0;
	}
	
	function pathMatcher(name) {
		var exp = name.replace(/\./g, "\\.").replace(
			/\*\*/g,
			"([a-zA-Z0-9\\.#]+|##)"
		).replace(
			/\*/g,
			"([a-zA-Z0-9\\*]+)"
		).replace(/#/g, "\\*");
		return new RegExp("^" + exp + "$");
	}
	
	function isObject(object) {
		return Object.prototype.toString.call(object) === "[object Object]";
	}
	
	function getter(object) {
		return function () {
			return object;
		};
	}

	function onAll(thiz, topicPrefix, object) {
		var key;
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				thiz.on(topicPrefix + key, object[key]);
			}
		}
	}
	
	function topicExtractorProxy(fn, topic) {
		var re = new RegExp("^" + topic.replace(topicPlaceholderRE,
			"([a-zA-Z0-9\\.]+)"
		) + "$");
		return function () {
			var args = array_slice.call(arguments);
			var m = this.topic.match(re), i = 1, l = m.length;
			for (; i < l; i++) {
				args[i - 1] = m[i];
			}
			return fn.apply(this, args);
		};
	}
	
	var nodeProto = {
		create: hub.create,
		factory: hub.factory,
		peer: function (topic, factory, args) {
			var object;
			if (typeof topic === function_string) {
				object = hub.create(topic, factory);
				if (object) {
					this.on(object);
				}
			} else if (typeof factory === function_string) {
				object = hub.create(topic, factory, args);
				if (object) {
					this.on(topic, object);
				}
			} else {
				this.on(topic, factory);
			}
		}
	};
	
	var rootTopic = "**";
	
	function node(chainTopic, firstChild) {
		var initializer;
		if (!chainTopic) {
			chainTopic = rootTopic;
		} else {
			if (typeof chainTopic === "string") {
				validateTopic(chainTopic);
			} else {
				initializer = chainTopic;
				chainTopic = rootTopic;
			}
		}
		var chainTopicMatcher = pathMatcher(chainTopic);
		var chain;
		var children = firstChild ? [firstChild] : [];
		var thiz = Object.create(nodeProto);
		thiz.emit = function () {
			var topic;
			if (arguments.length) {
				topic = arguments[0];
				hub.validateTopic(topic);
			} else {
				topic = chainTopic;
			}
			var slicedArgs = array_slice.call(arguments, 1);
			if (topic.indexOf("{") !== -1) {
				topic = hub.substitute(topic, slicedArgs);
			}
			if (topic !== rootTopic && !chainTopicMatcher.test(topic)) {
				if (topic.indexOf("*") === -1 ||
						!pathMatcher(topic).test(chainTopic)) {
					return;
				}
				topic = rootTopic;
			}
			var scope = this.propagate ? this : hub.scope();
			if (!scope.topic) {
				scope = hub.topicScope(topic, scope);
			}
			if (chain) {
				chain.apply(scope, slicedArgs);
			}
			if (scope.aborted) {
				return scope.result();
			}
			var queue = scope.topicChainQueue;
			if (queue) {
				Array.prototype.push.apply(queue, children);
			} else {
				queue = scope.topicChainQueue = children.slice();
			}
			while (queue.length) {
				var child = queue.shift();
				child.emit.apply(scope, [topic].concat(slicedArgs));
				if (scope.aborted) {
					break;
				}
			}
			return scope.result();
		};
		thiz.matches = function (topic) {
			return chainTopicMatcher.test(topic);
		};
		thiz.topic = chainTopic;
		thiz.on = function (topic, fn, topicMatcher) {
			if (typeof topic === function_string) {
				thiz.on(chainTopic, topic);
				return;
			}
			if (isObject(topic)) {
				onAll(thiz, "", topic);
				return;
			}
			if (topic.indexOf("{") !== -1) {
				fn = topicExtractorProxy(fn, topic);
				topic = topic.replace(topicPlaceholderRE, "*");
			}
			if (isObject(fn)) {
				onAll(thiz, topic + ".", fn);
				fn = getter(fn); // store, so that emit returns the object.
			}
			if (chainTopic === topic) {
				if (!chain) {
					chain = hub.chain();
				}
				chain.on(fn);
				return;
			}
			var newChild, i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					child.on(topic, fn, topicMatcher);
					return;
				}
				if (!topicMatcher) {
					topicMatcher = pathMatcher(topic);
				}
				if (topicMatcher.test(child.topic)) {
					newChild = node(topic, child);
					newChild.on(topic, fn, topicMatcher);
					children[i] = newChild;
					return;
				}
			}
			newChild = node(topic);
			newChild.on(topic, fn);
			if (topic.indexOf("*") === -1) {
				children.unshift(newChild);
			} else {
				for (i = 0, l = children.length; i < l; i++) {
					var childTopic = children[i].topic;
					var result = topicComparator(childTopic, topic);
					if (result !== -1) {
						children.splice(i, 0, newChild);
						return;
					}
				}
				children.push(newChild);
			}
		};
		thiz.un = function (topic, fn) {
			if (typeof topic === function_string) {
				return thiz.un("**", topic);
			}
			if (chainTopic === topic) {
				return chain ? chain.un(fn) : -1;
			}
			var i, l, child;
			for (i = 0, l = children.length; i < l; i++) {
				child = children[i];
				if (child.matches(topic)) {
					if (child.un(topic, fn)) {
						return true;
					}
				}
			}
			validateTopic(topic);
			var fnType = typeof fn;
			if (fnType !== function_string) {
				throw new TypeError("Callback is " + fnType);
			}
			return false;
		};
		thiz.mix = function (topic) {
			if (typeof topic === "string") {
				hub.apply("emit", arguments).then(thiz.does.on());
			} else {
				thiz.on(topic);
			}
			return thiz;
		};
		thiz.does = new NodeDoes(thiz);
		if (initializer) {
			onAll(thiz, "", initializer);
		}
		return thiz;
	}

	hub.node = node;
	hub.topicComparator = topicComparator;
	hub.validateTopic = validateTopic;

}());
(function () {
	
	var root = hub.node();
	
	hub.root = root;
	
	hub.on = function (topic, fn) {
		root.on(topic, fn);
	};
	
	hub.un = function (topic, fn) {
		return root.un(topic, fn);
	};
	
	hub.emit = function () {
		return root.emit.apply(root, arguments);
	};
	
	hub.peer = function () {
		return root.peer.apply(root, arguments);
	};
	
	hub.reset = function () {
		hub.root = root = hub.node();
	};
	
}());
(function () {
	
	var PromiseDoes = hub.does.define("emit", "on", "un", "create", "factory",
		"peer", "mix", "resolve", "reject"
	);
	var array_slice = Array.prototype.slice;
	var function_string = "function";
	
	var promiseProto = {};
	["on", "un", "emit", "create", "factory", "peer", "mix"].forEach(
		function (name) {
			promiseProto[name] = function () {
				var args = array_slice.call(arguments);
				return this.then(function () {
					hub[name].apply(hub, args.concat(
						Array.prototype.slice.call(arguments)
					));
				});
			};
		}
	);
	
	function joinReject(joined) {
		return function () {
			joined.reject.apply(joined, arguments);
		};
	}
	
	function joinResolve(joined, promise) {
		return function () {
			var args1 = array_slice.call(arguments);
			promise.then(function () {
				var args2 = array_slice.call(arguments);
				joined.resolve.apply(joined, args1.concat(args2));
			});
		};
	}
	
	hub.promise = function (timeout, scope) {
		var callbacks = [];
		var errbacks = [];
		var result;
		var blockers = 0;
		var rejected = false;
		var timer;
		var thiz;
		
		function notify() {
			if (timer) {
				clearTimeout(timer);
			}
			var fns = rejected ? errbacks : callbacks;
			var i = 0, l = fns.length;
			for (; i < l; i++) {
				fns[i].apply(scope, result);
			}
			callbacks.length = 0;
			errbacks.length = 0;
		}
		
		function resolveReject(args) {
			result = array_slice.call(args);
			if (!blockers) {
				notify();
			}
		}
		
		function thenWait() {
			blockers--;
			if (!blockers && result) {
				notify();
			}
		}
				
		function checkResolved() {
			if (result) {
				throw new Error("Promise already " +
					(rejected ? "rejected" : "resolved"));
			}
		}
		
		thiz = Object.create(promiseProto);
		thiz.then = function (callback, errback) {
			if (!callback && !errback) {
				throw new TypeError("Require callback or errback");
			}
			if (callback && typeof callback !== function_string) {
				throw new TypeError("Callback is " + callback);
			}
			if (errback && typeof errback !== function_string) {
				throw new TypeError("Errback is " + errback);
			}
			if (callback) {
				callbacks.push(callback);
			}
			if (errback) {
				errbacks.push(errback);
			}
			if (!blockers && result) {
				notify();
			}
			return this;
		};
		thiz.resolve = function () {
			checkResolved();
			resolveReject(arguments);
			return this;
		};
		thiz.reject = function () {
			checkResolved();
			rejected = true;
			resolveReject(arguments);
			return this;
		};
		thiz.wait = function () {
			var i = 0, l = arguments.length;
			blockers += l;
			for (; i < l; i++) {
				arguments[i].then(thenWait, thenWait);
			}
			return this;
		};
		thiz.join = function (promise) {
			if (!promise || typeof promise.then !== function_string) {
				throw new TypeError("Promise is " + promise);
			}
			var joined = hub.promise(0, scope);
			this.then(joinResolve(joined, promise), joinReject(joined));
			promise.then(null, joinReject(joined));
			return joined;
		};
		thiz.does = new PromiseDoes(thiz);
		if (timeout) {
			timer = setTimeout(function () {
				thiz.reject(new hub.Error("timeout",
					"Promise timed out after {timeout} milliseconds", {
						timeout: timeout
					}
				));
			}, timeout);
		}
		return thiz;
	};

}());
(function () {
	
	var scopeProto = {};
	var scopeFunctionCache = {};
	var array_slice = Array.prototype.slice;
	
	["then", "join", "wait", "resolve", "reject"].forEach(function (name) {
		scopeProto[name] = function () {
			var promise = this.promise();
			promise[name].apply(promise, arguments);
		};
	});
	
	function scope(object) {
		var iteratorStack = [];
		var promise;
		var result;
		var args;
		var thiz = Object.create(scopeProto);
		thiz.aborted = false;
		thiz.stopPropagation = function () {
			thiz.aborted = true;
			iteratorStack.length = 0;
			if (arguments.length) {
				result = arguments[0];
			}
		};
		thiz.propagate = function () {
			if (arguments.length) {
				args = array_slice.call(arguments);
			}
			var size = iteratorStack.length;
			if (!size) {
				return this.result();
			}
			var iterator = iteratorStack[size - 1];
			if (!iterator.hasNext) {
				iterator.reset();
				iteratorStack.pop();
			} else {
				var nextResult = iterator().apply(this, args);
				if (promise) {
					result = promise;
					promise = undefined;
					result.then(function () {
						thiz.propagate.apply(thiz, args);
					});
					return result;
				} else if (nextResult && nextResult.then) {
					result = nextResult;
					result.then(function () {
						thiz.propagate.apply(thiz, args);
					});
					return;
				}
				result = hub.merge(result, nextResult);
			}
			return this.propagate.apply(this, args);
		};
		thiz.result = function () {
			if (result && result.then) {
				return result;
			}
			return hub.promise(0, this).resolve(result);
		};
		thiz.push = function (iterator) {
			iteratorStack.push(iterator);
		};
		thiz.promise = function (timeout, scope) {
			if (!promise) {
				promise = hub.promise(timeout || 0, scope || this);
			}
			return promise;
		};
		thiz.mix = function () {
			return object.mix.apply(object, arguments);
		};
		return thiz;
	}
	hub.scope = scope;
	
	function scoped(topic, fn) {
		if (topic) {
			topic += ".";
		}
		return function () {
			var args = array_slice.call(arguments);
			if (!args[0]) {
				throw new TypeError("Topic is " + args[0]);
			}
			args[0] = topic + args[0];
			return fn.apply(hub, args);
		};
	}
	
	var TopicScopeDoes = hub.does.define("emit", "on", "un", "create",
		"factory", "peer", "mix"
	);
	["resolve", "reject"].forEach(function (name) {
		TopicScopeDoes.prototype[name] = function () {
			var does = this._.promise().does;
			return does[name].apply(does, arguments);
		};
	});
	
	hub.topicScope = function (topic, scope) {
		if (!scope) {
			scope = hub.scope();
		}
		var p = topic.lastIndexOf(".");
		var namespace = p === -1 ? "" : topic.substring(0, p);
		var cache = scopeFunctionCache[namespace];
		if (!cache) {
			cache = {
				on: scoped(namespace, hub.on),
				un: scoped(namespace, hub.un),
				peer: scoped(namespace, hub.peer),
				emit: scoped(namespace, hub.emit),
				create: scoped(namespace, hub.create),
				factory: scoped(namespace, hub.factory)
			};
			scopeFunctionCache[namespace] = cache;
		}
		scope.topic = topic;
		scope.on = cache.on;
		scope.un = cache.un;
		scope.peer = cache.peer;
		scope.emit = cache.emit;
		scope.create = cache.create;
		scope.factory = cache.factory;
		scope.does = new TopicScopeDoes(scope);
		return scope;
	};
	
	var reset = hub.reset;
	hub.reset = function () {
		scopeFunctionCache = {};
		reset();
	};
	
}());
