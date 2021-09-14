var dbug = false;


var wetw = {
	css : [],
	js : []
}

var totFiles = 0;
var countFiles = 0;
var vStr = [];

//var versions;

/*function getVersions(message) {
	//console.log ("WWVFCS::Returning versions: " + versions + ".");
	chrome.runtime.sendMessage({"versions": versions});
}

function setVersions(message) {
	//console.log("WWVFCS::Setting version to " + message.versions + ".");
	versions = message.versions;
}*/

//Gets the css files used in the current page
function getStyleSheets() {
	if (dbug) console.log("3. getStyleSheets");
	var styleSheets = document.styleSheets;
	if (styleSheets == "undefined") {
		// Nothing
	} else {
		//console.log ("Got " + styleSheets.length + " stylesheets.");
		
		for (var i = 0; i < styleSheets.length; i++) {
			if (styleSheets[i]["href"] != null) {
				var url = styleSheets[i]["href"];
				var id = "ss" + i;
				var orig = styleSheets[i]["href"].match(/^.*\/\/[^\/]+(\/.*)$/);
				if (orig == null) {
					orig = styleSheets[i].href;
				} else {
					orig = orig[0];
				}
				
				//console.log ("Adding stylesheet " + url + ".");
				
				wetw["css"].push({"url" : url, "id" : id, "orig" : "(css: " + orig + ")"});
			}
		}
	}
	//getScripts();
}

//Gets the js files used in the current page
function getScripts() {
    	if (dbug) console.log("GetScripts...");
	var scripts = document.getElementsByTagName("script");
	if (scripts == "undefined") {
		// Nothing
	} else {
		//console.log ("Got " + scripts.length + " stylesheets.");
		
		for (var i=  0; i< scripts.length;i++) {
			if (scripts[i].src != null && scripts[i].src != "") {
				var nm = scripts[i].src.match(/\/([^\/]*)$/);
				var url = scripts[i].src;
				if (nm != null) {
					var id = scripts[i].getAttribute("id");
					if (id == null) {
						id = i + "#";		// I'm assuming there's a reason I pre-pended the i onto the id.
						if (nm == null) {
							id += "inline"; //What does this do? Won't be reached
						} else {
							id += nm[1];
						}
					}
					var orig = scripts[i].src;
					
					//console.log ("Adding stylesheet " + url + ".");
					
					wetw["js"].push({"url" : url, "id" : id, "orig" : "(js: " + orig + ")"});
				}
			}
		}
	}
}

//Gets the scripts and style sheets used in the current page, callback function deals with results
function getScriptsAndSheets(callback) {
 	if (dbug) console.log("2. getScriptsandSheets(callBack)");
	getStyleSheets();
	getScripts();
	
	//console.log("Sending back results: ");
	//console.log("Stylesheets: " + wetw.css.length + ".");
	//console.log ("Scripts: " + wetw.js.length + ".");
	
	if (callback) {
		callback();
	}
}

//Obtains file from remote URL
function getRemoteFile(file, callback) {
	if (dbug) console.log("wwvf-cs::4. getRemoteFile: " + file);
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
	
}

//Finds the versions of WET used given the contents of a web page
function getVersion(page) {
	if (dbug) console.log("wwvf-cs::Getting Version.");
	var rv = null;
	if (page) {
		var xVer = /v((\d+)\.(\d+)(?:\.(\d+(-?[a-z]\d+)?))?)(-development|release)?/i;
		if (page != "" && page.match(/Web Experience Toolkit/i)) {
			/*var vNumRe = /\* (.*?) v(\d[\d\.a-z]+)/;
			var wet3v = /\* Version: v(\d[\d\.a-zA-Z\-]+)/;
			var wet30 = /Web Experience Toolkit/;
			var wet40 = /v((\d+(\.|-[a-z]\d*))+(-development|release)?)/i;*/
			var clf2Theme = /(CLF 2.0 theme|CSS presentation layer) v(\d+.\S+)/i;
	
			var clf2ThemeVer = page.match(clf2Theme);
			if (clf2ThemeVer) {
				rv = "2.x";
			} else {
				// Can't be WET 2.0.
				var totVer = page.match(xVer);
				if (!totVer) {
					if (page.match(/Web Experience Toolkit|WET/i)) {
						totVer = page.match(/\* +((\d+)\.(\d+)(?:\.(\d+(-?[a-z]\d+)?))?)(-development|release)?/);
					}
				}
				if (totVer) {
					rv = totVer[1];
				} else {
					rv = "?";
				}
			}
		}
	}
	return rv;
}

//Finds the versions of WET in each file and sends version string to background script when all files are processed
function dealWithFile(txt, url) {
	if (dbug) console.log("wwvf-cs::5. dealWithFile: " + url);
	countFiles++;
	var ver = getVersion(txt);
	if (ver && vStr.indexOf(ver) == -1) vStr.push(ver);
	//if (countFiles >= totFiles) {
	//	chrome.runtime.sendMessage({vStr: vStr});
	//}
}

//Calls getRemoteFile for each css and js file found on the page
function processScriptsAndSheets() {
	if (dbug) console.log("wwvf-cs::processScriptAndSheets");
	if (wetw) {
		totFiles = wetw["css"].length + wetw["js"].length;
		countFiles = 0;
		vStr = [];
		for (var i = 0; i < wetw["css"].length; i++) {
			if (wetw["css"][i]["url"] != "") {
				if (dbug) console.log("wwvf-cs:: gonna deal with css file " + wetw["css"][i]["url"]);
				getRemoteFile(wetw["css"][i]["url"], dealWithFile); //getFile()
			}
		}
		for (var i = 0; i < wetw["js"].length; i++) {
			if (wetw["js"][i]["url"] != "") {
				if (dbug) console.log("wwvf-cs:: gonna deal with js file " + wetw["js"][i]["url"]);
				getRemoteFile(wetw["js"][i]["url"], dealWithFile); //getFile()
			}
		}
	} else {
		chrome.runtime.sendMessage({});
	}
	
}

//Sends all css and js files found on the page to the popup script to be displayed
function sendToDisplay() {
	if (dbug) console.log("wwvf-cs::sending To Display...");
	chrome.runtime.sendMessage({"msg" : "sending wetw info for the popup", "wetw": wetw });
}

//Checks the message received to determine which function to call
//Calls processScriptsAndSheets if the message is from background script
//Calls sendToDisplay if the message is from popup script
function findVersion(message, sender, sendMessage) {
	if (dbug) console.log("wwvf-cs::message.name: " + message.name + ".");
	if (dbug) console.log("wwvf-cs::1. FindVersion for " + document.title + ".");
	
	if (message.name.match(/getScriptsAndSheets/)) {
		getScriptsAndSheets(processScriptsAndSheets);
	} else if (message.name.match(/getInfo/)) {
		getScriptsAndSheets(sendToDisplay);
	} else if (message.name.match(/getVerStr/)) {
		//chrome.runtime.sendMessage({vStr: vStr});
		sendMessage({"task" : "updateLabel", "vStr" : vStr});
	
	} /*else if (message.name.match(/getVersions/)) {
		getVersions(message.name);
	} else if (message.name.match(/setVersions/)) {
		setVersions(message.name);
	}*/
	
}

//Listens for messages from background script and popup script
browser.runtime.onMessage.addListener(findVersion);
/*
document.addEventListener("DOMContentLoaded", function () {
	if (dbug) console.log ("wwvf-cs::Content Loaded.");

}, false);
*/
if (dbug) console.log("wwvf-cs.js loaded");
if (document.location.href.match("https?:\/\/")) findVersion({"name" : "getScriptsAndSheets"});

