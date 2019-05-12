let http = require("http");
let fs = require("fs");
let url = require("url");

let ROOT_DIR = "html";
let ROOT_SONG_DIR = "songs";

let MIME_TYPES = {
	css: "text/css",
	gif: "image/gif",
	htm: "text/html",
	html: "text/html",
	ico: "image/x-icon",
	jpeg: "image/jpeg",
	jpg: "image/jpeg",
	js: "text/javascript",
	json: "application/json",
	png: "image/png",
	txt: "text/plain"
};

let get_mime = function(filename) {
	let ext, type;
	for (ext in MIME_TYPES) {
		type = MIME_TYPES[ext];
		if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
			return type;
		}
	}
	return MIME_TYPES["txt"];
};

http.createServer(function(request, response) {
	let urlObj = url.parse(request.url, true, false);
	console.log("\n============================");
	console.log("PATHNAME: " + urlObj.pathname);
	console.log("REQUEST: " + ROOT_DIR + urlObj.pathname);
	console.log("METHOD: " + request.method);

	let receivedData = "";

	request.on("data", function(chunk) {
		receivedData += chunk;
	});

	request.on("end", function() {
		console.log("received data: ", receivedData);
		console.log("type: ", typeof receivedData);

		if (request.method == "POST" && urlObj.pathname === "/fetchSong") {
			let dataObj = JSON.parse(receivedData);

			console.log("USER REQUEST: " + dataObj.text);

			let returnObj = {};
			let selectedSong = "";

			if (dataObj.text.toLowerCase() === "peaceful easy feeling" ) {
				selectedSong = "Peaceful Easy Feeling";
			} else if (dataObj.text.toLowerCase() === "sister golden hair") {
				selectedSong = "Sister Golden Hair";
			} else if (dataObj.text.toLowerCase() === "brown eyed girl") {
				selectedSong = "Brown Eyed Girl";
			}

			let filePath = ROOT_SONG_DIR + "/" + selectedSong + ".txt";

			fs.readFile(filePath, function(err,data){
				if (err) {
					console.log("ERROR: Song not found." );
					response.writeHead(404);
					response.end(JSON.stringify(err));
					return;
				}

				returnObj.lyricsArray = String(data).split("\n");

				response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
				response.end(JSON.stringify(returnObj));
			});
		} else if (request.method == "POST") {
			let returnObj = {};
			returnObj.text = "UNKNOWN REQUEST";

			response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
			response.end(JSON.stringify(returnObj));
		}

		if (request.method == "GET") {
			let filePath = ROOT_DIR + urlObj.pathname;
			if (urlObj.pathname === "/") filePath = ROOT_DIR + "/assignment1.html";

			fs.readFile(filePath, function(err, data) {
				if (err) {
					console.log("ERROR: " + JSON.stringify(err));
					response.writeHead(404);
					response.end(JSON.stringify(err));
					return;
				}
				response.writeHead(200, { "Content-Type": get_mime(filePath) });
				response.end(data);
			});
		}
	});
})
.listen(3000);

console.log("Server Running at http://localhost:3000/ CNTL-C to quit");
