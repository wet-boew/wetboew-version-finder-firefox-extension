if (typeof (wwvf) == "undefined") {
	var wwvf = {};
}
wwvf = {
	dbug : true,
	//Obtains file from remote URL
	getRemoteFile : function (file, callback) {
		var xmlhttp = new XMLHttpRequest();
		try {
			if (file.match(/^c:/i)) {
				file = file.replace(/\\/g, "/");
				file = "file:///" + file;
			}
		
			xmlhttp.open("GET", file, true);
			xmlhttp.onreadystatechange = function () {
				if (xmlhttp.readyState == 4) {
					if (xmlhttp.status == 404) {
						callback("404", file);
					}
					if (xmlhttp.status == 0 || xmlhttp.status == 200) callback(xmlhttp.responseText, file);
				}
			}
			xmlhttp.send();
		}
		catch (ex) {
			callback(null);
		}
	}, // End of getRemoteFile

	//Compares two version strings
	//3.0.2-a1 is less than 3.0.2
	isStringLessThan : function (x, y) {
		// NOTE:  Must deal with actual versions, like rc.
		var returnValue = true;
		x = x.toString();
		y = y.toString();
		var output = "isStringLessThan::\n" + x + " v " + y + "?";
		if (x.match(/^-?\d+$/)) {
			var parts = y.match(/^(-?\d+?)-(.*)$/);
			if (parts) {
				output += "\nComparing strings " + x + " with " + parts[1] + ".";
				if (x < parts[1]) {
					output += "\nAnd " + x + " is less than " + parts[1] + ".\nReturning true.";
					returnValue = true;
				} else {
					output += "\nAnd " + x + " is greater than " + parts[1] + ".\nReturning false.";
					returnValue = false;
				}
			}
		} else if (y.match(/^-?\d+$/)) {
			var parts = x.match(/^(-?\d+?)-(.*)$/);
			if (parts) {
				output += "\nComparing strings " + y + " with " + parts[1] + ".";
				if (parts[1] <= y) {
					output += "\nAnd " + parts[1] + " is less than or equal to " + y + ".\nReturning true.";
					returnValue = true;
				} else {
					output += "\nAnd " + parts[1] + " is greater than " + y + ".\nReturning false.";
					returnValue = false;
				}
			}
		} else if (x.match(/\d-.+/) && y.match(/\d-.+/)) {
			var xparts = x.match(/^(-?\d+?)-([a-z]+)(\d*)$/);
			var yparts = y.match(/^(-?\d+?)-([a-z]+)(\d*)$/);

			if (xparts && yparts) {
				output += "Comparing strings " + xparts[1] + " with " +  yparts[1] + ".";
				if (xparts[1] < yparts[1]) {
					output += "\nAnd " + xparts[1] + " is less than " + yparts[1] + ".\nReturning true.";
					returnValue = true;
				} else if (xparts[1] > yparts[1]) {
					output += "\nAnd " + xparts[1] + " is greater than " + yparts[1] + ".\nReturning false.";
					returnValue =false;
				} else if (xparts[1] == yparts[1]) {
					output += "\n" + xparts[1] + " == " + yparts[1] + ".";
					if (xparts[2] && yparts[2]) {
						if (xparts[2].replace("development", "zdevelopment") < yparts[2].replace("development", "zdevelopment")) {
							output += "\n" + xparts[2].replace("development", "zdevelopment") + " is less than " + yparts[2].replace("development", "zdevelopment") + ".\nReturning true.";
							returnValue = true;
						} else  if (xparts[2].replace("development", "zdevelopment") > yparts[2].replace("development", "zdevelopment")) {
							output += "\n" + xparts[2].replace("development", "zdevelopment") + " is greater than " + yparts[2].replace("development", "zdevelopment") + ".\nReturning false.";
							returnValue = false;
						} else if (xparts[2] == yparts[2]) {
							if (xparts[3] && yparts[3]) {
								if (xparts[3] < yparts[3]) {
									returnValue = true;
								} else {
									returnValue = false;
								}
							} else {
								returnValue = false;
							}
						}
					} else {
						returnValue = false;
					}
				}
			} else {
				output += "\nCan't compare.";
			}
		}
		//console.log(output);
		return returnValue;
	}, // End of isStringLessThan

	//Checks if a version of WET is out of date
	//Returns true if thisVer is less than lsv
	isOutOfDate : function (lsv, thisVer) {

		if (lsv == "WET Widget Not Found") return true;

		var returnValue = false;
		var lsva = lsv.split(".");
		var thisVera = thisVer.split(".");
		var output = "Is " + thisVer + " less than " + lsv + "?\n";
		var keepGoing = true;
	
		for (var i = 0; keepGoing & i < Math.min(lsva.length, thisVera.length) && !returnValue; i++) {
			if (thisVera[i].match(/^-?\d+$/) && lsva[i].match(/^-?\d+$/)) {
				if (parseInt(thisVera[i]) < parseInt(lsva[i])) {
					keepGoing = false;
					returnValue = true;
				} else if (parseInt(thisVera[i]) > parseInt(lsva[i])) {
					keepGoing = false;
				}
			} else {
				if (wwvf.isStringLessThan(thisVera[i], lsva[i])) returnValue = true;
			}
		}
	
		if (keepGoing & thisVera.length < lsva.length) returnValue = true;
		output += "Returning " + returnValue + ".";
		//console.log(output);
		return returnValue;

	}, // End of isOutOfDate

}

if (wwvf.dbug) console.log ("wwvf loaded.");
