let lines = [];
let words = [];

let wordBeingMoved;

let deltaX, deltaY;
let canvas = document.getElementById("canvas1");

function getWordAtLocation(aCanvasX, aCanvasY) {
	let context = canvas.getContext("2d");

	for (let i = 0; i < words.length; i++) {
		let wordWidth = context.measureText(words[i].word).width;

		if ((aCanvasX > words[i].x && aCanvasX < (words[i].x + wordWidth)) &&
			(aCanvasY > words[i].y - 20 && aCanvasY < words[i].y)) {
			return words[i];
		}
	}
	return null;
}

function drawCanvas() {
	let context = canvas.getContext("2d");

	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);

	context.font = "18pt Courier New";

	for (let i = 0; i < words.length; i++) {
		let data = words[i];
		if (data.lyric) {
			context.fillStyle = "blue";
			context.strokeStyle = "blue";
		}
		if (data.chord) {
			context.fillStyle = "green";
			context.strokeStyle = "green";
		}
		context.fillText(data.word, data.x, data.y);
		context.strokeText(data.word, data.x, data.y);
	}
}

function getCanvasMouseLocation(e) {
	let rect = canvas.getBoundingClientRect();

	let scrollOffsetX = $(document).scrollLeft();
	let scrollOffsetY = $(document).scrollTop();

	let canX = e.pageX - rect.left - scrollOffsetX;
	let canY = e.pageY - rect.top - scrollOffsetY;

	return { canvasX: canX, canvasY: canY };
}

function handleMouseDown(e) {
	let canvasMouseLoc = getCanvasMouseLocation(e);
	let canvasX = canvasMouseLoc.canvasX;
	let canvasY = canvasMouseLoc.canvasY;
	console.log("mouse down:" + canvasX + ", " + canvasY);

	wordBeingMoved = getWordAtLocation(canvasX, canvasY);
	if (wordBeingMoved != null ) {
		deltaX = wordBeingMoved.x - canvasX;
		deltaY = wordBeingMoved.y - canvasY;
		$("#canvas1").mousemove(handleMouseMove);
		$("#canvas1").mouseup(handleMouseUp);
	}

	e.stopPropagation();
	e.preventDefault();

	drawCanvas();
}

function handleMouseMove(e) {
	let canvasMouseLoc = getCanvasMouseLocation(e);
	let canvasX = canvasMouseLoc.canvasX;
	let canvasY = canvasMouseLoc.canvasY;

	console.log("move: " + canvasX + ", " + canvasY);

	wordBeingMoved.x = canvasX + deltaX;
	wordBeingMoved.y = canvasY + deltaY;

	e.stopPropagation();

	drawCanvas();
}

function handleMouseUp(e) {
	e.stopPropagation();

	$("#canvas1").off("mousemove", handleMouseMove);
	$("#canvas1").off("mouseup", handleMouseUp);

	drawCanvas();
}

let ENTER = 13;

function handleKeyUp(e) {
	if (e.which == ENTER) {
		handleSubmitButton();
		$("#userTextField").val("");
	}

	e.stopPropagation();
	e.preventDefault();
}

function parseChordProFormat(chordProLinesArray) {
	for (let i = 0; i < chordProLinesArray.length; i++) {
		chordProLinesArray[i] = chordProLinesArray[i].replace(/(\r\n|\n|\r)/gm, "");
	}

	let chordLine = "";
	let lyricLine = "";

	let textDiv = document.getElementById("text-area");
	textDiv.innerHTML = "";

	for (let i = 0; i < chordProLinesArray.length; i++) {
		let line = chordProLinesArray[i];
		textDiv.innerHTML = textDiv.innerHTML + `<p>${line}</p>`;
		let isReadingChord = false;
		chordLine = "";
		lyricLine = "";
		let chordLength = 0;

		for (let charIndex = 0; charIndex < line.length; charIndex++) {
			let ch = line.charAt(charIndex);
			if (ch === "[") {
				isReadingChord = true;
				chordLength = 0;
				if (chordLine.length > 0 && !chordLine.endsWith(" ")) chordLine = chordLine + " ";
			}
			if (ch === "]") {
				isReadingChord = false;
			}
			if (!isReadingChord && ch != "]") {
				lyricLine = lyricLine + ch;
				if (chordLength > 0) chordLength--;
				else chordLine = chordLine + " ";
			}
			if (isReadingChord && ch != "[") {
				chordLine = chordLine + ch;
				chordLength++;
			}
		}

		let characterWidth = canvas.getContext("2d").measureText("m").width;

		chordLine += " ";
		if (chordLine.trim().length > 0) {
			let theChordSymbol = "";
			let theChordLocationIndex = -1;
			for (let j = 0; j < chordLine.length; j++) {
				let ch = chordLine.charAt(j);
				if (ch == " ") {
					if (theChordSymbol.trim().length > 0) {
						let word = {
							word: theChordSymbol,
							x: 40 + theChordLocationIndex * characterWidth,
							y: 40 + i * 2 * 40,
							chord: "chord"
						};
						words.push(word);
					}
					theChordSymbol = "";
					theChordLocationIndex = -1;
				} else {
					theChordSymbol += ch;
					if (theChordLocationIndex === -1) theChordLocationIndex = j;
				}
			}
		}

		lyricLine += " ";
		if (lyricLine.trim().length > 0) {
			let theLyricWord = "";
			let theLyricLocationIndex = -1;
			for (let j = 0; j < lyricLine.length; j++) {
				let ch = lyricLine.charAt(j);
				if (ch == " ") {
					if (theLyricWord.trim().length > 0) {
						let word = {
							word: theLyricWord,
							x: 40 + theLyricLocationIndex * characterWidth,
							y: 40 + i * 2 * 40 + 25,
							lyric: "lyric"
						};
						words.push(word);
					}
					theLyricWord = "";
					theLyricLocationIndex = -1;
				} else {
					theLyricWord += ch;
					if (theLyricLocationIndex === -1) theLyricLocationIndex = j;
				}
			}
		}
	}
}

function realignLyicsAndChords() {
	for (let i = 0; i < words.length; i++) {
		if (words[i].chord) {
			words[i].oldY = words[i].y;
			words[i].y = words[i].y + 25;
		}
	}

	words.sort(function(wordA, wordB) {
		if (wordA.y < wordB.y) return -1;
		if (wordA.y === wordB.y) return 0;
		if (wordA.y > wordB.y) return 1;
	});

	let linesToSaveArray = [];
	let currentLineArray = [];
	let currentHeight = -1;
	for (let i = 0; i < words.length; i++) {
		if (currentHeight === -1) currentHeight = words[i].y;
		if (Math.abs(words[i].y - currentHeight) < 25) {
			words[i].y = currentHeight;
			currentLineArray.push(words[i]);
		} else {
			currentHeight = words[i].y;
			linesToSaveArray.push(currentLineArray);
			currentLineArray = [];
			currentLineArray.push(words[i]);
		}
	}

	if (currentLineArray.length > 0) linesToSaveArray.push(currentLineArray);

	lines = [];
	console.log("lines to save length: " + linesToSaveArray.length);
	for (let i = 0; i < linesToSaveArray.length; i++) {
		let stringToSave = convertWordsToString(linesToSaveArray[i]);
		lines.push(stringToSave);
	}

	for (let i = 0; i < words.length; i++){
		if (words[i].chord) {
			words[i].y = words[i].y - 25;
		}
	}

	return lines;
}

function convertWordsToString(arrayOfWords) {
	arrayOfWords.sort(function(wordA, wordB) {
		if (wordA.x < wordB.x) return -1;
		if (wordA.x === wordB.x) return 0;
		if (wordA.x > wordB.x) return 1;
	});

	let chordsOnly = [];
	let wordsOnly = [];
	for (let i = 0; i < arrayOfWords.length; i++) {
		if (arrayOfWords[i].lyric) wordsOnly.push(arrayOfWords[i]);
		if (arrayOfWords[i].chord) chordsOnly.push(arrayOfWords[i]);
	}

	if (wordsOnly.length === 0) {
		let theString = "";
		for (let i = 0; i < chordsOnly.length; i++) {
			theString += "[" + chordsOnly[i].word + "]";
			theString += " ";
		}
		return theString.trim();
	}

	if (chordsOnly.length === 0) {
		let theString = "";
		for (let i = 0; i < wordsOnly.length; i++) {
			theString += wordsOnly[i].word;
			theString += " ";
		}
		return theString.trim();
	}

	let characterWidth = canvas.getContext("2d").measureText("m").width;
	let theString = "";
	while (chordsOnly.length > 0 && chordsOnly[0].x <= wordsOnly[0].x) {
		theString += "[" + chordsOnly[0].word + "]";
		chordsOnly.reverse();
		chordsOnly.pop();
		chordsOnly.reverse();
	}
	for (let i = 0; i < wordsOnly.length; i++) {
		currentPosition = wordsOnly[i].x;
		let lyricStr = wordsOnly[i].word;
		for (let chIdx = 0; chIdx < lyricStr.length; chIdx++) {
			while (chordsOnly.length > 0 && chordsOnly[0].x <= currentPosition) {
				theString += "[" + chordsOnly[0].word + "]";
				chordsOnly.reverse();
				chordsOnly.pop();
				chordsOnly.reverse();
			}
			theString += lyricStr.charAt(chIdx);
			currentPosition += characterWidth;
		}
		theString += " ";
		currentPosition += characterWidth;
	}

	while (chordsOnly.length > 0 ) {
		theString += "[" + chordsOnly[0].word + "]" + " ";
		chordsOnly.reverse();
		chordsOnly.pop();
		chordsOnly.reverse();
	}

	return theString.trim();
}

function handleSubmitButton() {
	let userText = $("#userTextField").val();
	if (userText && userText !== "") {
		let userRequestObj = { text: userText };
		let userRequestJSON = JSON.stringify(userRequestObj);
		$("#userTextField").val("");

		$.post("fetchSong", userRequestJSON, function(data, status) {
			console.log("data: " + data);
			console.log("typeof: " + typeof data);
			let responseObj = data;
			lines = [];
			words = [];
			if (responseObj.songLines) {
				lines = responseObj.songLines;
				parseChordProFormat(lines);
			}
			drawCanvas();
		});
	}
}

function handleRefreshButton() {
	console.log("Refresh...");

	console.log("****song lines to refresh *****");
	let textDiv = document.getElementById("text-area");
	textDiv.innerHTML = "";
	realignLyicsAndChords();
	for (let i = 0; i < lines.length; i++) {
		console.log(lines[i]);
		textDiv.innerHTML = textDiv.innerHTML + `<p>${lines[i]}</p>`;
	}
}

function handleSaveAsButton() {
	console.log("Save As...");
	let userText = $("#userTextField").val();

	console.log("****song lines to save *****");
	let textDiv = document.getElementById("text-area");
	textDiv.innerHTML = "";
	realignLyicsAndChords();
	for (let i = 0; i < lines.length; i++) {
		console.log(lines[i]);
		textDiv.innerHTML = textDiv.innerHTML + `<p>${lines[i]}</p>`;
	}
	if (userText && userText !== "" && words.length > 0) {
		let userRequestObj = { text: "save" };
		let saveAsFileName = userText;
		userRequestObj.saveAsFileName = saveAsFileName;

		userRequestObj.songLines = lines;

		let userRequestJSON = JSON.stringify(userRequestObj);
		$("#userTextField").val("");

		$.post("saveSong", userRequestJSON);
	}
}

function transpose(semitones) {
	if(semitones === 0) return;
	for (let i = 0; i < words.length; i++) {
		if (words[i].chord) {
			words[i].word = transposeChord(words[i].word, semitones);
		}
	}
}

function transposeChord(aChordString, semitones) {
	console.log(`transposeChord: ${aChordString} by ${semitones}`);

	let RootNamesWithSharps = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
	let RootNamesWithFlats = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"];
	let rootNames = RootNamesWithSharps;
	let transposedChordString = "";
	for (let i = 0; i< aChordString.length; i++) {
		if (rootNames.findIndex(function(element) { return element === aChordString[i]; }) === -1) {
			if ((aChordString[i] !== "#") && (aChordString[i] !== "b")) transposedChordString += aChordString[i];
		} else {
			let indexOfSharp = -1;
			let indexOfFlat = -1;
			if (i < aChordString.length -1) {
				indexOfSharp = RootNamesWithSharps.findIndex(function(element) { return element === (aChordString[i] + aChordString[i+1]); });
				if (indexOfSharp !== -1) transposedChordString += RootNamesWithSharps[(indexOfSharp + 12 + semitones) % 12];
				indexOfFlat = RootNamesWithFlats.findIndex(function(element) { return element === (aChordString[i] + aChordString[i+1]); });
				if (indexOfFlat !== -1) transposedChordString += RootNamesWithFlats[(indexOfFlat + 12 + semitones) % 12];
			}
			if ((indexOfSharp === -1) && (indexOfFlat === -1)) {
				let index = rootNames.findIndex(function(element) { return element === aChordString[i]; });
				if (index !== -1) transposedChordString += rootNames[(index + 12 + semitones) % 12];
			}
		}
	}
	return transposedChordString;
}

function handleTransposeUpButton() {
	transpose(1);
	drawCanvas();
}

function handleTransposeDownButton(){
	transpose(-1);
	drawCanvas();
}

$(document).ready(function() {
	$("#canvas1").mousedown(handleMouseDown);

	$(document).keyup(handleKeyUp);

	drawCanvas();
})
