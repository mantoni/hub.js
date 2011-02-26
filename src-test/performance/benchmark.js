var benchmarkTable = document.getElementsByTagName("table")[0];
function runBenchmark(title, tests) {
	function reloader(ttime, test) {
		var link = document.createElement("a");
		link.href = "javascript:void(null)";
		link.onclick = function() {
			while(ttime.hasChildNodes()) {
				ttime.removeChild(ttime.firstChild);
			}
			setTimeout(function() {
				var time = new Date().getTime();
				test(iterations);
				var now = new Date().getTime();
				ttime.appendChild(document.createTextNode(String(now - time)));
				Hub.reset();
			}, 1);
		};
		link.appendChild(document.createTextNode("Refresh"));
		return link;
	}
	setTimeout(function() {
		var caption = document.createElement("th");
		caption.setAttribute("colspan", "3");
		caption.appendChild(document.createTextNode(title));
		benchmarkTable.appendChild(caption);
		for(var name in tests) {
			var time = new Date().getTime();
			tests[name](iterations);
			var now = new Date().getTime();
			var tr = document.createElement("tr");
			var ttime = document.createElement("th");
			ttime.setAttribute("width", "80");
			ttime.setAttribute("align", "right");
			ttime.appendChild(document.createTextNode(String(now - time)));
			tr.appendChild(ttime);
			var tname = document.createElement("td");
			tname.appendChild(document.createTextNode(name));
			tr.appendChild(tname);
			var tagain = document.createElement("td");
			tagain.appendChild(reloader(ttime, tests[name]));
			tr.appendChild(tagain);
			benchmarkTable.appendChild(tr);
			Hub.reset();
		}
	}, 15);
}