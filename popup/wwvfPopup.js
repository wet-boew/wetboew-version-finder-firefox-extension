var dbug = false;

var wetObj = {
	lsv : {},
	ldv : {},
	thisVersion : {},
	versions : {},
	thisHash : {}
};

var dryObj = {};
var safeFiles = {};
var totFiles = 0;
var countFiles = 0;
var vStr = [];
var displayInfo = true;

//Compares two version strings
//3.0.2-a1 is less than 3.0.2
function isStringLessThan(x, y) {
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
}

//Checks if a version of WET is out of date
//Returns true if thisVer is less than lsv
function isOutOfDate(lsv, thisVer) {

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
			if (isStringLessThan(thisVera[i], lsva[i])) returnValue = true;
		}
	}
	
	if (keepGoing & thisVera.length < lsva.length) returnValue = true;
	output += "Returning " + returnValue + ".";
	//console.log(output);
	return returnValue;

}

//Retrieves the saved xmlFile and determines WET versions
function getSavedData(callback) {
	
	chrome.storage.local.get("xmlFile", function(item) {
		var highestStableVersion = "-1.-1.-1";
		var highestDevVersion = "-1.-1.-1";
		var xmlDoc = item.xmlFile;
		//console.log(xmlDoc);
		var versions = xmlDoc.latestVersions;
		//console.log(versions);
		
		if (versions) {
			for (thisVersion in versions) {
				//console.log(thisVersion);
				if (wetObj["versions"][thisVersion] == undefined) wetObj["versions"][thisVersion] = {};
				var subVersions = versions[thisVersion];
				//console.log(subVersions);
				if (subVersions) {
					for (thisSubVersion in subVersions) {
						//console.log(thisSubVersion);
						if (wetObj["versions"][thisVersion][thisSubVersion] == undefined) wetObj["versions"][thisVersion][thisSubVersion] = {"dev": null, "stbl":null};
						var release = subVersions[thisSubVersion];
						//console.log(release);
						if (release) {
							wetObj["versions"][thisVersion][thisSubVersion]["dev"] = release.dev;
							wetObj["versions"][thisVersion][thisSubVersion]["stbl"] = release.stbl;
							//console.log(release.dev);
							//console.log(release.stbl);
							if (isOutOfDate(highestStableVersion, thisVersion + "." + thisSubVersion + "." + release.stbl)) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.stbl;
							//if (isOutOfDate(thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev"))) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev");
						}
					}
				}
			}
		}
		if (xmlDoc.lsr) {
			wetObj["lsrWET"] = xmlDoc.lsr;
			//console.log(xmlDoc.lsr);
		} else {
			wetObj["lsrWET"] = highestStableVersion;
		}
		if (xmlDoc.ldr) {
			wetObj["ldrWET"] = xmlDoc.ldr;
			//console.log(xmlDoc.ldr);
		} else {
			wetObj["ldrWET"] = highestDevVersion;
		}
		if (dbug) console.log(wetObj);
		
		if (callback) callback();
	});
}

//Runs content script in current page
function run() {
	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (tabs[0]) {
			//chrome.tabs.executeScript(null, {
			//	file: "/content_scripts/content.js"
			//});
			if (dbug) console.log ("wwvf::popup.js::sending message to cs to getInfo.");
			chrome.tabs.sendMessage(tabs[0].id, {name: "getInfo"});
		}
	});
	
}

function isEmpty(obj) {
	for (var i in obj) {
		return false;
	}
	return true;
}

function getXmlHash(version, fileName) {
	var xmlDoc = chrome.storage.local.get("xmlHashFiles");
	var xmlHash = [];
	var widgetRoot = xmlDoc.getElementsByTagName("widgets");
	
	if (widgetRoot != null) {
		var directories = widgetRoot[0].getElementsByTagName("dir");
		if (directories) {
			for (var i = 0; i < directories.length; i++) {
				var thisDirectory = directories[i].getAttribute("name");
				if (thisDirectory.indexOf(version) > -1) {
					var files = directories[i].getElementsByTagName("file");
					if (files) {
						for (var j = 0; j < files.length; j++) {
							var thisFileName = files[j].getAttribute("name");
							if (thisFileName === fileName) {
								if (xmlHash.indexOf(files[j].getAttribute("hash")) == -1) xmlHash.push(files[j].getAttribute("hash"));
							}
						}
					}
				}
			}
		}
	}
	return xmlHash;
}

//Displays results in popup window
function display() {
	if (dbug) console.log("Displaying");
	var wl = wetObj;
	var wwvfList = document.getElementById("wwvfTree");
	var dryList = document.getElementById("dryTreeChildren");
	var txtNode = document.getElementById("wwvfVerString");
	
	if (txtNode && txtNode != undefined) {
		if (vStr.length > 0) {
			var text = document.createTextNode(vStr.join("/"));
			txtNode.appendChild(text);
		} else {
			var text = document.createTextNode("No WET Widgets detected on this page.");
			txtNode.appendChild(text);
		}
	}
	if (isEmpty(wl["thisVersion"])) {
		var treerow = document.createElement("tr");
		var listcell1 = document.createElement("td");
		listcell1.setAttribute("colspan", "4");
		var text = document.createTextNode("No WET Widgets detected on this page.");
		
		listcell1.appendChild(text);
		treerow.appendChild(listcell1);
		wwvfList.appendChild(treerow);
	}
	
	//Displaying first table
	for (var i in wl["thisVersion"]) {
		var treerow = document.createElement("tr");
		var listcell1 = document.createElement("td");
		var listcell2 = document.createElement("td");
		var listcell3 = document.createElement("td");
		var listcell4 = document.createElement("td");
		
		var text1 = document.createTextNode(i);
		listcell1.appendChild(text1);
		var text2 = document.createTextNode(wl["thisVersion"][i]);
		listcell2.appendChild(text2);
		
		if (wl["lsv"][i] == undefined) {
			if (wl["lsrWET"] != null) {
				var thisVersion = wl["thisVersion"][i].split(".");
				if (wl["versions"][thisVersion[0]] == undefined) {
					// There's nothing in latestVer, so maybe the XML file hasn't been updated lately,
					// or it's 2.x
					wl["lsv"][i] = wl["lsrWET"];
					wl["ldv"][i] = wl["ldrWET"];
				} else {
					// The latest version is there (so, it's 3 as of this writing)
					if (wl["versions"][thisVersion[0]][thisVersion[1]] == undefined) {
						wl["lsv"][i] = wl["lsrWET"];
						wl["ldv"][i] = wl["ldrWET"];  // Actually, you should find the latest subversion
					} else {
						wl["lsv"][i] = thisVersion[0] + "." + thisVersion[1] + "." + wl["versions"][thisVersion[0]][thisVersion[1]]["stbl"];
						wl["ldv"][i] = (wl["versions"][thisVersion[0]][thisVersion[1]]["dev"] ? thisVersion[0] + "." + thisVersion[1] + "." + wl["versions"][thisVersion[0]][thisVersion[1]]["dev"] : wl["ldrWET"]);
					}
				}
			} else {
				wl["lsv"][i] = "WET Widget Not Found";
			}
		} else {
			if (wl["ldv"][i] == undefined) wl["ldv"][i] = wl["lsv"][i];
		}
		
		var text3 = document.createTextNode(wl["lsv"][i]);
		listcell3.appendChild(text3);
		
		//parse i to get just the URL
		var url = i.substring(i.lastIndexOf(": ")+1,i.lastIndexOf(")"));
		var fileName = url.split('/').pop();
		
		//TODO: fix xmlHash, add-on is running very slowly right now so add it later
		//var xmlHash = getXmlHash(wl["thisVersion"][i], fileName);
		var xmlHash = [];
		
		if (xmlHash.length == 0) {
			var text4 = document.createTextNode("not in XML");
			listcell4.appendChild(text4);
		} else {
			var lbl = "no";
			var foundIt = false;
			for (var j = 0; j < xmlHash.length && !foundIt; j++) {
				if (wl["thisHash"][i] == xmlHash[j]) foundIt = true;
			}
			var text4 = document.createTextNode(foundIt ? "no" : "yes");
			listcell4.appendChild(text4);
		}
		
		treerow.appendChild(listcell1);
		treerow.appendChild(listcell2);
		treerow.appendChild(listcell3);
		treerow.appendChild(listcell4);
		wwvfList.appendChild(treerow);
		
		var compVersion = wl["lsv"][i]; //(wl["thisVersion"][i].match(/^\d$/) ? wl["lsv"][i] : wl["ldv"][i]);
		
		if (!(i.match(/jquery/i)) && isOutOfDate(compVersion, wl["thisVersion"][i])) {
			var treerowInner = document.createElement("tr");
			var treecellInner = document.createElement("td");
			treecellInner.setAttribute("colspan", "4");
			
			if (wl["lsv"][i] == "WET Widget Not Found") {
				var text = document.createTextNode("Not on WET site.");
				treecellInner.appendChild(text);
			} else {
				var text = document.createTextNode("Out of date");
				treecellInner.appendChild(text);
			}
			
			treerow.appendChild(treecellInner);
			wwvfList.appendChild(treerowInner);
		}
	}
	
	//Displaying second table
	for (var i in dryObj) {
		var treerow = document.createElement("tr");
		var listcell1 = document.createElement("td");
		var listcell2 = document.createElement("td");
		var listcell3 = document.createElement("td");
		
		if (i.match(/jquery/i)) {
			var text1 = document.createTextNode(dryObj[i]["name"]);
			listcell1.appendChild(text1);
			var text2 = document.createTextNode(dryObj[i]["subtype"]);
			listcell2.appendChild(text2);
			var text3 = document.createTextNode(dryObj[i]["ver"]);
			listcell3.appendChild(text3);
			
			if (dryObj[i]["subtype"] == "jquery") {
				var treerowInner = document.createElement("tr");
				var treecellInner = document.createElement("td");
				
				treerow.setAttribute("id", "jqueryRow");
				treecellInner.setAttribute("id", "jqueryMsg");
				treecellInner.setAttribute("colspan", "3");
			
				treerowInner.appendChild(treecellInner);
				dryList.appendChild(treerowInner);
				// By now the tree is built
			}
		}
		
		treerow.appendChild(listcell1);
		treerow.appendChild(listcell2);
		treerow.appendChild(listcell3);
		dryList.appendChild(treerow);
		
		updateJQueryLine(i);
	}
}

//Obtains file from remote URL
function getRemoteFile(file, callback) {
	
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
					callback("404");
				}
				if (xmlhttp.status == 0 || xmlhttp.status == 200) callback(xmlhttp.responseText);
			}
		}
		xmlhttp.send();
	}
	catch (ex) {
		callback(null);
	}
	
}

function getHash(str) {
	var hash = 0, i, chr, len = str.length;
	if (len == 0) return hash;
	for (i = 0; i < len; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0;
	}
	return hash;
}

function updateJQueryLine(nm) {
	var jqueryRow = document.getElementById("jqueryRow");
	var jqueryMsg = document.getElementById("jqueryMsg");
	if (jqueryRow) {
		if (dryObj[nm]["safe"] == false) {
			var text = document.createTextNode("File has been corrupted.");
			jqueryMsg.appendChild(text);
		} else if (dryObj[nm]["safe"] == true) {
			var text = document.createTextNode("File is safe.");
			jqueryMsg.appendChild(text);
		}
	}
}

//Finds the versions of WET used on a page
function getVers(id, page, orig) {
	
	//var callback = (arguments.length > 3 && (arguments[3] != null && arguments[3] != false) ? arguments[3] : null);
	
	if (page) {
		var xVer = /v((\d+)\.(\d+)(?:\.(\d+(-?[a-z]\d+)?))?)(-development|release)?/i;
		
		if (id != "" && page != "" && page.match(/Web Experience Toolkit/i)) {
			/*var vNumRe = /\* (.*?) v(\d[\d\.a-z]+)/;
			var wet3v = /\* Version: v(\d[\d\.a-zA-Z\-]+)/;
			var wet30 = /Web Experience Toolkit/;
			var wet40 = /v((\d+(\.|-[a-z]\d*))+(-development|release)?)/i;*/
			var clf2Theme = /(CLF 2.0 theme|CSS presentation layer) v(\d+.\S+)/i;
			var urlHash = getHash(page);
			var origRe = orig.match(/^(\(?:css|js\)?: ).*\/\/[^\/]+(\/.*)$/);
			
			if (origRe != null) {
				orig = origRe[1] + origRe[2];
			}
			
			var clf2ThemeVer = page.match(clf2Theme);
			
			if (clf2ThemeVer) {
				wetObj["thisVersion"]["WET 2.x " + orig] = clf2ThemeVer[2];
				wetObj["thisHash"]["WET 2.x " + orig] = urlHash;
				if (vStr.indexOf("2.x") == -1) vStr.push("2.x");
			} else {
				// Can't be WET 2.0.
				var totVer = page.match(xVer);
				if (!totVer) {
					if (page.match(/Web Experience Toolkit|WET/i)) {
						totVer = page.match(/\* +((\d+)\.(\d+)(?:\.(\d+(-?[a-z]\d+)?))?)(-development|release)?/);
					}
				}
				if (totVer) {
					var ver = totVer[1];
					wetObj["thisVersion"]["WET 3 " + orig] = totVer[2] + "." + totVer[3] + (totVer[4] ? "." + totVer[4] : "");
					wetObj["thisHash"]["WET 3 " + orig]  = urlHash;
					if (vStr.indexOf(ver) == -1) vStr.push(ver);
				} else {
					// Can't tell which WET version
					wetObj["thisVersion"]["WET ?.x " + orig] = "unknown";
					wetObj["thisHash"]["WET ?.x " + orig] = urlHash;
					if (vStr.indexOf("?") == -1) vStr.push("?");
				}
			}
		} else {
			// Not WET
			if (id.match(/jquery.*\.js/i)) {
				var jVer = /jQuery(.*?)(?:v?@?)((\d+)\.(\d+)(?:\.(\d+(-?[a-z]\d+)?))?)(-development|release)?/i;
				var totVer = page.match(jVer);
				
				if (totVer) {
					var jqSubtype = totVer[1].trim();
					if (jqSubtype == "" || jqSubtype.match(/(Javascript Library|: ?")/i)) {
						jqSubtype = "jquery";
					}
					var origRe = orig.match(/^.*\/\/[^\/]+(\/.*)$/);
					if (origRe != null) orig = origRe[1];

					var ver = totVer[1];
					var nm = "JQuery " + orig;
					dryObj[nm] = {name : orig.replace(/\)/, ""), subtype : jqSubtype, ver : "-1.-1.-1", safe : "Loading..."};
					dryObj[nm]["ver"] = totVer[2]; // + "." + totVer[3] + (totVer[4] ? "." + totVer[4] : "");
					var min = "";
					
					if (jqSubtype == "jquery") {
						// Check if it's right.
						if (id.match(/min/i) || !page.match(/Javascript Library/i)) min = ".min";
						var sourceURL = "http://code.jquery.com/jquery-" + totVer[2] +  min + ".js";
						
						getRemoteFile (sourceURL, function (doc) {
							if (doc == "404") console.log ("WWVF::" + sourceURL + " is not found.");
							// Get rid of extra white spaces
							var mdoc = doc.replace(/[\n\f\r\l\t]/g, "");
							var mpage = page.replace(/[\n\f\r\l\t]/g, "");

							// Get rid of comments...
							// First:  // comments.
							mdoc = mdoc.replace(/\/\/.*$/g, "");
							mpage = mpage.replace(/\/\/.*$/g, "");
							// Second:  /*  comments */
							mdoc = mdoc.replace(/\/\*.*?\*\//g, "");
							mpage = mpage.replace(/\/\*.*?\*\//g, "");

							var pageHash = getHash(mpage);
							var sourceHash = getHash(mdoc);
							if (sourceHash != pageHash) {
								safeFiles["JQuery " + orig] = false;
								dryObj[nm]["safe"] = false;
							} else {
								safeFiles["JQuery " + orig] = true;
								dryObj[nm]["safe"] = true;
							}
							// If, by this point, the display window is already up, then this next line will update the JQuery line.
							// If, however, it's not, it will do nothing.  See the display function
							//TODO: result is printed multiple times in updateJQueryLine
							//updateJQueryLine(nm);//"JQuery " + orig);
						});
					}
				} else {
					var nm = "JQuery?? " + orig.replace(/\)/, "");
					dryObj[nm] = {name : orig, subtype : "Unknown?", ver : "-1.-1.-1"};
				}
			}
		}
		//if (callback) callback();
	} else {
		wetObj["thisVersion"]["WET ?.x " + orig] = "unknown";
	}
	
	countFiles++;
	if ((countFiles >= totFiles) && displayInfo) {
		displayInfo = false;
		display();
	}
	
}

//Calls getRemoteFile for each css and js file found on the page
function processScriptsAndSheets(message) {
	
	totFiles = message.wetw["css"].length + message.wetw["js"].length;
	countFiles = 0;
	vStr = [];
	displayInfo = true;
	for (var i = 0; i < message.wetw["css"].length; i++) {
		if (message.wetw["css"][i]["url"] != "") {
			getRemoteFile(message.wetw["css"][i]["url"], function (id, orig) {
				return function (page) {
					getVers(id, page, orig);
				}
			} (message.wetw["css"][i]["id"], message.wetw["css"][i]["orig"]));
		}
	}
	for (var i = 0; i < message.wetw["js"].length; i++) {
		if (message.wetw["js"][i]["url"] != "") {
			getRemoteFile(message.wetw["js"][i]["url"], function (id, orig) {
				return function (page) {
					getVers(id, page, orig);
				}
			} (message.wetw["js"][i]["id"], message.wetw["js"][i]["orig"]));
		}
	}
	
}

//Checks if the message is meant for the popup script
function checkMessage(message, sender, sendMessage) {
	if (dbug) console.log ("wwvf::popup.js::Got message");
	if (message.wetw) {
		processScriptsAndSheets(message);
	}
}

//Gets saved data from storage then calls content script
getSavedData(run);
//Listens for messages from content script
chrome.runtime.onMessage.addListener(checkMessage);
