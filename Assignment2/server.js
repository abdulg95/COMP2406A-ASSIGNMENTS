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
	js: "application/javascript",
	json: "application/json",
	png: "image/png",
	svg: "image/svg+xml",
	txt: "text/plain"
};

let songFiles = {
	"Peaceful Easy Feeling": ROOT_SONG_DIR + "/Peaceful Easy Feeling.txt",
	"Sister Golden Hair": ROOT_SONG_DIR + "/Sister Golden Hair.txt",
	"Brown Eyed Girl": ROOT_SONG_DIR + "/Brown Eyed Girl.txt",
	"Never My Love": ROOT_SONG_DIR + "/Never My Love.txt"
};

function get_mime(filename) {
	for (let ext in MIME_TYPES) {
		if (filename.indexOf(ext, filename.length - ext.length) !== -1) {
			return MIME_TYPES[ext];
		}
	}
	return MIME_TYPES["txt"];
}

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

		let dataObj = undefined;
		let returnObj = {};

		if (request.method == "POST") {
			dataObj = JSON.parse(receivedData);
			console.log("received data object: ", dataObj);
			console.log("type: ", typeof dataObj);
			console.log("USER REQUEST: " + dataObj.text);
			returnObj.text = "NOT FOUND: " + dataObj.text;
		}

		if (request.method == "POST" && urlObj.pathname === "/fetchSong") {
			let songFilePath = "";
			for (let title in songFiles) {
				if (title === dataObj.text) {
					songFilePath = songFiles[title];
					returnObj.text = "FOUND";
				}
			}

			if (songFilePath === "") {
				response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
				response.end(JSON.stringify(returnObj));
			} else {
				fs.readFile(songFilePath, function(err, data) {
					if (err) {
						returnObj.text = "FILE READ ERROR";
						response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
						response.end(JSON.stringify(returnObj));
					} else {
						let fileLines = data.toString().split("\n");
						for (let i in fileLines) fileLines[i] = fileLines[i].replace(/(\r\n|\n|\r)/gm, "");
						returnObj.text = songFilePath;
						returnObj.songLines = fileLines;
						returnObj.filePath = songFilePath;
						response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
						response.end(JSON.stringify(returnObj));
					}
				});
			}
		} else if (request.method == "POST" && urlObj.pathname === "/saveSong") {
			let songLines = dataObj.songLines;
			let saveAsFileName = dataObj.saveAsFileName;
			let saveAsFilePath = ROOT_SONG_DIR + "/" + saveAsFileName + ".txt";
			let fileDataString = "";
			for (let i = 0; i < songLines.length; i++) {
				fileDataString += songLines[i];
				if (i < songLines.length - 1) fileDataString += "\n";
			}
			fs.writeFile(saveAsFilePath, fileDataString, function(err, data) {
				let returnObj = {};
				returnObj.text = "Saved: " + saveAsFilePath;
				response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
				response.end(JSON.stringify(returnObj));
				songFiles[saveAsFileName] = saveAsFilePath;
			});
		} else if (request.method == "POST") {
			let returnObj = {};
			returnObj.text = "UNKNOWN REQUEST";
			response.writeHead(200, { "Content-Type": MIME_TYPES["json"] });
			response.end(JSON.stringify(returnObj));
		} else if (request.method == "GET") {
			let filePath = ROOT_DIR + urlObj.pathname;
			if (urlObj.pathname === "/") filePath = ROOT_DIR + "/assignment2.html";

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
}).listen(3000);

console.log("Server Running at http://localhost:3000/ CNTL-C to quit");
