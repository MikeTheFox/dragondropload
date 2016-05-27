
// Runs this script with node when clicked on in windows...
if (this["WScript"]) {
	var args = [];
	if (WScript.Arguments.length !== 0) for (var i = 0; i < WScript.Arguments.length; i++) args.push(WScript.Arguments(i));
	WScript.Quit(WScript.CreateObject('WScript.Shell').Run("node \"" + WScript.ScriptFullName + "\"" + (args.length ? (" \"" + args.join("\" \"") + "\"") : ""), 10, true));
}

// Node modules
var exec = require('child_process').exec;
var port = parseInt(process.argv[2] || 56667);
var formidable = require("formidable");

// Create a server
var Server = require('./sv.server');
var server = Server.create();

server.callbacks["api/upload"] = function (request, response, uri) {
	var form = new formidable.IncomingForm();
	form.uploadDir = "./uploads";
	form.keepExtensions = true;
    form.parse(request, function (err, fields, files) {
		if (fields.count === undefined) {
			response.end();
		}
		var names = [];
		for (var i = 0; i < parseInt(fields.count, 10); i++) {
			var file = files['file' + i];
			console.log('Upload ' + (i + 1) + ': ' + file.name + ' - location: uploads\\' + file.path);
			names.push(file.name);
		}
		server.writeJSON(response, {'upload': names});
    });
};

server.mimetypes =  {
	"css": "text/css",
	"htm": "text/html",
	"html": "text/html",
	"js" : "application/javascript",
	"png": "image/png",
	"": "application/octet-stream"
};

server.root = "html";

server.listen(port, function() {
	console.log('Server now listening on port ' + port + '.');
	exec('start chrome.exe "http://127.0.0.1:' + port + '/"');
});