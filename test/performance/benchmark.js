/**
 * Copyright 2011, Maximilian Antoni
 * Released under the MIT license:
 * https://github.com/mantoni/hub.js/raw/master/LICENSE
 */
var benchmarkTable = document.getElementsByTagName("table")[0];
var benchmarkQueue = [];
var benchmarkRunning = false;
var benchmarkSum = 0;

function runBenchmark(title, tests) {
	
	function run(ttime, fn) {
		var time = new Date().getTime();
		try {
			fn(iterations);
		}
		catch(e) {
			ttime.appendChild(document.createTextNode("FAILURE"));
			ttime.title = e.message;
			ttime.style.color = "red";
			return;
		}
		finally {
			Hub.reset();
		}
		var now = new Date().getTime();
		var diff = now - time;
		benchmarkSum += diff;
		ttime.appendChild(document.createTextNode(formatNumber(String(diff))));
	}
	
	function reloader(ttime, fn) {
		var link = document.createElement("a");
		link.href = "javascript:void(null)";
		link.onclick = function() {
			while(ttime.hasChildNodes()) {
				ttime.removeChild(ttime.firstChild);
			}
			setTimeout(function() {
				run(ttime, fn);
			}, 1);
		};
		link.appendChild(document.createTextNode("Refresh"));
		return link;
	}
		
	function executeNext() {
		var name;
		for(name in tests) {
			break;
		}
		if(!name) {
			runNextOnQueue();
			return;
		}
		var fn = tests[name];
		delete tests[name];
		
		var tr = document.createElement("tr");
		var ttime = document.createElement("th");
		ttime.setAttribute("width", "80");
		ttime.setAttribute("align", "right");
		tr.appendChild(ttime);
		var tname = document.createElement("td");
		tname.appendChild(document.createTextNode(name));
		tr.appendChild(tname);
		var tagain = document.createElement("td");
		tagain.appendChild(reloader(ttime, fn));
		tr.appendChild(tagain);
		benchmarkTable.appendChild(tr);
		
		setTimeout(function() {
			run(ttime, fn);
			executeNext();
		}, 10);
	}
	
	function testRunner() {
		var caption = document.createElement("th");
		caption.setAttribute("colspan", "3");
		caption.appendChild(document.createTextNode(title));
		benchmarkTable.appendChild(caption);
		setTimeout(executeNext, 50);
	}
	
	function runNextOnQueue() {
		if(benchmarkQueue.length) {
			benchmarkQueue.shift()();
		}
		else {
			var sumTable = document.getElementsByTagName("table")[1];
			var tr = document.createElement("tr");
			var ttime = document.createElement("th");
			ttime.setAttribute("width", "80");
			ttime.setAttribute("align", "right");
			ttime.appendChild(document.createTextNode(formatNumber(String(benchmarkSum))));
			tr.appendChild(ttime);
			sumTable.appendChild(tr);
			sumTable.style.visibility = "visible";
		}
	}
	
	benchmarkQueue.push(testRunner);
	
	if(!benchmarkRunning) {
		benchmarkRunning = true;
		runNextOnQueue();
	}
	
}