/*var wetObj = {
	lsv : {},
	ldv : {},
	thisVersion : {},
	versions : {},
	thisHash : {},
	latestVer : {}
};*/

/*function getLocalFile(file) {
	var xmlhttp=new XMLHttpRequest();
	if (file.match(/^[a-z]:/i)) {
		file = file.replace(/\\/g, "/");
		file = "file:///" + file;
	}
	if (!file.match(/^file/i)) file = "file:///" + file;
	try {
		xmlhttp.open("GET",file,false);
		xmlhttp.send();
		return xmlhttp.responseText;
	}
	catch (ex) {
		return null;
	}
}*/

//Obtains file from remote URL

var dbug = false;

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

/*function countObjs(obj) {
	var returnValue = 0;
	for (var i in obj) {
		returnValue++;
	}
	return returnValue;
}*/

/*function saveFile(filename, contents, callback) {
	console.log("Saving file: " + filename);
	console.log(contents);
	chrome.storage.local.set({filename: contents});
	if (callback != undefined) {
		callback(true);
	}
}*/

//Finds the latest available versions from the WET web page
function getLatestVersions(callback) {
	
	getRemoteFile("http://wet-boew.github.io/wet-boew/docs/versions/dwnld-en.html", function (page) {
		if (page == "404" || page == null) {

			if (callback != undefined) callback(false);
		} else {
			var vTotNum = /\/v([\da-z\-]+)\.([\da-z\-]+)(?:\.(\d+(-(release|[a-z]+\d+))?))?(?:-src\.zip|\.zip)[^>]*>\s*Download\s*</gim;
			var totnums = page.match(vTotNum);
			var latestVer = {};
			var ver;
			var voutput = "";
			var lsr = -1;
			var ldr = -1;
			
			for (var i = 0; i < totnums.length; i++) {
				
				vTotNum = /\/v([\da-z\-]+)\.([\da-z\-]+)(?:\.(\d+(-(release|[a-z]+\d+))?))?(?:-src\.zip|\.zip)[^>]*>\s*Download\s*</gim;
				ver = vTotNum.exec(totnums[i]);
				
				var thisVersion = ver[1];
				var thisSubVersion = ver[2];
				var thisSubSubVersion = (ver[3] ? ver[3] : "0");
				thisSubVersion = thisSubVersion.replace(/-release/i, "");
				thisSubVersion = thisSubVersion.replace(/-dist?/i, "");
				thisSubSubVersion = thisSubSubVersion.replace(/-release/i, "");
				thisSubSubVersion = thisSubSubVersion.replace(/-dist?/i, "");
				thisVersion = parseInt(thisVersion);
				
				if (thisSubSubVersion.match(/^\d+$/)) {
					if (lsr == -1) {
						// Highest Version has not been found.  Set it to the current default
						lsr = thisVersion + "." + thisSubVersion + "." + thisSubSubVersion;
					} else {
						// A value currently resides in highestSVer.  Replace it with this if it's higher:
						if (isOutOfDate(thisVersion + "." + thisSubVersion + "." + thisSubSubVersion, lsr)) {
							lsr = thisVersion + "." + thisSubVersion + "." + thisSubSubVersion;
						}
					}
				} else {
					if (ldr == -1) {
						// Highest Version has not been found.  Set it to the current default
						ldr = thisVersion + "." + thisSubVersion + "." + thisSubSubVersion;
					} else {
						// A value currently resides in highestSVer.  Replace it with this if it's higher:
						if (isOutOfDate(thisVersion + "." + thisSubVersion + "." + thisSubSubVersion, ldr)) ldr = thisVersion + "." + thisSubVersion + "." + thisSubSubVersion;
					}
				}
				
				voutput += thisVersion  + "." + thisSubVersion + "." + thisSubSubVersion + "\n";
				thisSubVersion = parseInt(thisSubVersion);
				thisSubSubVersion = parseInt(thisSubSubVersion);
				
				if (latestVer[thisVersion] == null) {
					latestVer[thisVersion] = {};
					latestVer[thisVersion][thisSubVersion] = {stbl : "", dev : ""};
					latestVer[thisVersion][thisSubVersion][(thisSubSubVersion.toString().match(/^\d+$/) ? "stbl" : "dev")] = thisSubSubVersion;
				} else {
					if (latestVer[thisVersion][thisSubVersion] == undefined) {
						latestVer[thisVersion][thisSubVersion] = {stbl : "", dev : ""};
						latestVer[thisVersion][thisSubVersion][(thisSubSubVersion.toString().match(/^\d+$/) ? "stbl" : "dev")] = thisSubSubVersion;
					}
					// Is thisSubSubVersion a stable release, or a candiate/alpha/beta?
					if (thisSubSubVersion.toString().match(/^\d+$/)) {
						// stable
						if (thisSubSubVersion > latestVer[thisVersion][thisSubVersion]["stbl"]) latestVer[thisVersion][thisSubVersion]["stbl"] = thisSubSubVersion;
					} else {
						if (thisSubSubVersion > latestVer[thisVersion][thisSubVersion]["dev"]) latestVer[thisVersion][thisSubVersion]["dev"] = thisSubSubVersion;
					}
				}
			}
			
			//Converting latestVer json to xml file
			
			/*var highestVer = -1;
			var highestSubVer = -1;
			var highestSubSubVer = -1;
			var verOutstring = "\t<latestVersions>\n";
			var latestVersions = {};
			
			for (var v in latestVer) {
				if (v > -1) {
					highestVer = v;
					highestSubVer = -1;
					highestSubSubVer = -1;
				}
				verOutstring += "\t\t<version ver=\"" + v + "\">\n";
				latestVersions[v] = {};
				for (var sv in latestVer[v]) {
					if (v == highestVer) {
						if (sv > highestSubVer)	{
							var output = "Setting highestSubVer from " + highestVer + "." + highestSubVer + " to ";
							highestSubVer = sv;
							output += highestVer + "." + highestSubVer + ".";
						}
						if (sv == highestSubVer) {
							if (isStringLessThan(highestSubSubVer, latestVer[v][sv])) {
								var output = "Setting highestSubVer from " + highestVer + "." + highestSubVer + "." + highestSubSubVer + " to ";
								highestSubSubVer = latestVer[v][sv];
								output += highestVer + "." + highestSubVer + "." + highestSubSubVer  + ".";
							}
							
						}
					}
					verOutstring += "\t\t\t<subversion ver=\"" + sv + "\">\n\t\t\t\t<release stbl=\"" + latestVer[v][sv]["stbl"] + "\" dev=\"" + latestVer[v][sv]["dev"] + "\" />\n\t\t\t</subversion>\n";
					latestVersions[v][sv] = {
						stbl: latestVer[v][sv]["stbl"],
						dev: latestVer[v][sv]["dev"]
					};
				}
				verOutstring += "\t\t</version>\n"
			}
			verOutstring += "\t</latestVersions>\n";*/

			var obj = {
				lsr: lsr,
				ldr: ldr,
				latestVersions: latestVer
			};
			
			// The following is from WET2:
			//var vNumRe = / title="v[\d\.]+ - Latest stable release - [^"]*?"/gim;
			//var wv = {};
			//var vTitles = page.match(vNumRe);
			//var outString = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<widgets lsr=\"" + lsr + "\" ldr =\"" + ldr + "\">\n" + verOutstring;
			/*if (vTitles == null ) {
				//Need to distinguish between releases, sub-releases and, beta-releases
				if (countObjs(wetObj) == 0) getSavedData();
				var i = 0;
				for (var w in wetObj["lsv"]) {
					i++;
					var nm = w.replace(/"/g, "&quot;");
					outString += "\t<widget id=\"w" + i + "\" name=\"" + nm + "\">\n\t\t<latestStableVersion>" + wetObj["lsv"][w] + "</latestStableVersion>\n\t</widget>\n";
				}

			} else {
				// This is from WET 2.0.
				for (var i = 0; i < vTitles.length; i++) {
					var ver = vTitles[i].match(/v([\d\.]+)/);
					ver = ver[1];
					var wName = vTitles[i].match(/Latest stable release - ([^"]*?)"/);
					wName = wName[1];
					wv[ver] = wName;
					outString += "\n\t<widget id=\"w" + i + "\" name=\"" + wName + "\">\n\t\t<latestStableVersion>" + ver + "</latestStableVersion>\n\t</widget>";
				}
			}*/
			//outString += "\n</widgets>";
			
			//console.log("Saving file: xmlFile");
			//console.log(outString);
			chrome.storage.local.set({xmlFile: obj});
			if (callback != undefined) {
				callback();
			}
			//saveFile("xmlFile", outString, callback); //storage
		}
	});

}

//Retrieves the saved xmlFile and determines WET versions
/*function getSavedData() {
	
	chrome.storage.local.get("xmlFile", function(item) {
		var highestStableVersion = "-1.-1.-1";
		var highestDevVersion = "-1.-1.-1";
		var xmlDoc = item.xmlFile;
		console.log(xmlDoc);
		var versions = xmlDoc.latestVersions;
		console.log(versions);
		
		if (versions) {
			for (thisVersion in versions) {
				console.log(thisVersion);
				if (wetObj["versions"][thisVersion] == undefined) wetObj["versions"][thisVersion] = {};
				var subVersions = versions[thisVersion];
				console.log(subVersions);
				if (subVersions) {
					for (thisSubVersion in subVersions) {
						console.log(thisSubVersion);
						if (wetObj["versions"][thisVersion][thisSubVersion] == undefined) wetObj["versions"][thisVersion][thisSubVersion] = {"dev": null, "stbl":null};
						var release = subVersions[thisSubVersion];
						console.log(release);
						if (release) {
							wetObj["versions"][thisVersion][thisSubVersion]["dev"] = release.dev;
							wetObj["versions"][thisVersion][thisSubVersion]["stbl"] = release.stbl;
							console.log(release.dev);
							console.log(release.stbl);
							if (isOutOfDate(highestStableVersion, thisVersion + "." + thisSubVersion + "." + release.stbl)) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.stbl;
							//if (isOutOfDate(thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev"))) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev");
						}
					}
				}
			}
		}
		if (xmlDoc.lsr) {
			wetObj["lsrWET"] = xmlDoc.lsr;
			console.log(xmlDoc.lsr);
		} else {
			wetObj["lsrWET"] = highestStableVersion;
		}
		if (xmlDoc.ldr) {
			wetObj["ldrWET"] = xmlDoc.ldr;
			console.log(xmlDoc.ldr);
		} else {
			wetObj["ldrWET"] = highestDevVersion;
		}
		console.log(wetObj);
		
		//Old way using getElementById
		/*var xmlDoc = item.xmlFile;
		var widgetRoot = xmlDoc.getElementsByTagName("widgets");
		var highestStableVersion = "-1.-1.-1";
		var highestDevVersion = "-1.-1.-1";
		
		if (widgetRoot != null) {
			var versions = widgetRoot[0].getElementsByTagName("version");
			if (versions) {
				for (var i = 0; i < versions.length; i++) {
					var thisVersion = versions[i].getAttribute("ver");
					if (wetObj["versions"][thisVersion] == undefined) wetObj["versions"][thisVersion] = {};
					var subVersions = versions[i].getElementsByTagName("subversion");
					if (subVersions) {
						for (var j = 0; j < subVersions.length; j++) {
							var thisSubVersion = subVersions[j].getAttribute("ver");
							if (wetObj["versions"][thisVersion][thisSubVersion] == undefined) wetObj["versions"][thisVersion][thisSubVersion] = {"dev": null, "stbl":null};
							var releases = subVersions[j].getElementsByTagName("release");
							if (releases) {
								var release = releases[0];
								wetObj["versions"][thisVersion][thisSubVersion]["dev"] = release.getAttribute("dev");
								wetObj["versions"][thisVersion][thisSubVersion]["stbl"] = release.getAttribute("stbl");
								if (isOutOfDate(highestStableVersion, thisVersion + "." + thisSubVersion + "." + release.getAttribute("stbl"))) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.getAttribute("stbl");
								//if (isOutOfDate(thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev"))) highestStableVersion = thisVersion + "." + thisSubVersion + "." + release.getAttribute("dev");
							}
						}
					}
				}
			}
			wetObj["latestVer"] = {};
			if (widgetRoot[0].getAttribute("lsr")) {
				wetObj["lsrWET"] = widgetRoot[0].getAttribute("lsr");
			} else {
				wetObj["lsrWET"] = highestStableVersion;
			}
			if (widgetRoot[0].getAttribute("ldr")) {
				wetObj["ldrWET"] = widgetRoot[0].getAttribute("ldr");
			} else {
				wetObj["ldrWET"] = highestDevVersion;
			}
			var widgets = xmlDoc.getElementsByTagName("widget");
			if (widgets) {
				for (var i = 0; i < widgets.length; i++) {
					var name = widgets[i].getAttribute("name");
					var ver = widgets[i].getElementsByTagName("latestStableVersion")[0].childNodes[0].nodeValue;
					wetObj["lsv"][name] = ver;
				}
			}
		}*//*
	});
}*/

//Gets the wetHashFiles and saves to storage
function hashDateCheck() {
	
	var xmlUrl = "http://a8047681.hrdc-drhc.net/wwvfFiles/wetHashFiles.xml";
	getRemoteFile (xmlUrl, function (page) {
		if (page == "404") {
			//console.log("URLError");
			if (callback != undefined) callback(false);
		} else {
			/*saveFile("xmlHashFiles", page, function(t) {
				if (t == true) {
					//doing nothing here... callback was just giving issues before
				}
			});*/
			//console.log("Saving file: xmlHashFile");
			//console.log(page);
			chrome.storage.local.set({xmlHashFile: page});
		}
	});

}

//Runs content script in active tab
function run() {
	if (dbug) console.log ("wwvf-bg::running.");
	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (tabs[0]) {
			//chrome.tabs.executeScript(null, {
			//	file: "/content_scripts/content.js"
			//});
			if (dbug) console.log ("wwvf-bg::sending message to get scripts and sheets.");
			chrome.tabs.sendMessage(tabs[0].id, {name: "getScriptsAndSheets"});
		}
	});
	
}

//On tab update, checks to see if the url was changed and if it is the active tab
/*function checkUpdate(tabId, changeInfo, tab) {
	
	if (!changeInfo.url) {
		return;
	}
	
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		if (tabId == tabs[0].id) {
			run();
		}
	});
	
}*/

//If versions of WET are found on the page, changes the browser action title to the versions
function updateLabel(message, sender, sendMessage) {
	
	//console.log(message);
	if (message.vStr) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.browserAction.setTitle({title: message.vStr.join("/"), tabId: tabs[0].id});
		});
	} /*else {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.browserAction.setTitle({title: chrome.i18n.getMessage("extensionName"), tabId: tabs[0].id});
		});
	}*/
}

//On start up of background script, gets the latests versions of WET and the WET hash file
getLatestVersions();
//getLatestVersions(getSavedData);
hashDateCheck();
//run();

//Listens for tab activations and page updates

chrome.tabs.onActivated.addListener(function (activeInfo) {
		if (dbug) console.log ("wwvf-bg::tab (" + activeInfo.tabId + "/" + activeInfo.windowId + ") has been activated.");
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			if (tabs[0]) {
				//chrome.tabs.executeScript(null, {
				//	file: "/content_scripts/content.js"
				//});
				if (dbug) console.log ("wwvf-bg::sending message to get scripts and sheets.");
				browser.tabs.sendMessage(tabs[0].id, {name: "getVerStr"}).then(updateLabel, null);
			}
		});
		//run();
	}
);
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tabInfo) {
		if (dbug) console.log ("wwvf-bg::tab " + tabId + "(" + changeInfo.url + "/" + changeInfo.title + "(" + changeInfo.status + ")) has been updated to " + tabInfo.url +"/"+tabInfo.title +"(" + tabInfo.status + ").");
		if (tabInfo.status == "complete") browser.tabs.sendMessage(tabId, {name: "getVerStr"}).then(updateLabel, null);
	}
);
//chrome.tabs.onReplaced.addListener(run);	// Doesn't actually do anything.

//Listens for messages from content script
chrome.runtime.onMessage.addListener(updateLabel);

if (dbug) console.log ("wwvf-bg.js loaded.");
