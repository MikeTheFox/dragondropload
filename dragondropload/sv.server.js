/*
 * File: sv.server.js
 *
 */
 
var fs = require("fs"),
	http = require('http'),
    path = require("path"),
	url = require("url")
;

function ServerFactory() { }

ServerFactory.create = function () {
	"use strict";

	var callbacks = {}
	,	handlers = {}
	,	indexfile = "index.htm"
	,	mimetypes = {}
	,   root = ""
	,   server = null;

	handlers[""] = function (request, response, uri) {
		// Get the file name, might be a path...
		var filename = path.join(process.cwd(), root, uri.pathname);
		fs.exists(filename, function (exists) {
			if (!exists) {
				handlers["404"](request, response, uri, 404);
				return;
			}
			if (fs.statSync(filename).isDirectory()) {
				filename += indexfile;
			}
			fs.readFile(filename, "binary", function (err, file) {
				if (err) {        
					handlers["500"](request, response, err, 500);
					return;
				}
				var extension = filename.split(".");
				extension = extension[extension.length - 1] || "";
				response.writeHead(200, {"Content-Type": mimetypes[extension] || mimetypes[""]});
				response.write(file, "binary");
				response.end();
			});
		});
	};
	
	handlers["404"] = function (request, response, uri, code) {
		try {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not Found\n");
			response.end();
		} catch ( e ) {
			console.warn('Exception in not found response. (404)', e);
		}
	};
	
	handlers["500"] = function(request, response, uri, code) {
		try {
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write("500 Internal Server Error\n");
			if(arguments.length > 2) response.write(arguments[2] + "\n");
			response.end();
		} catch ( e ) {
			console.warn('Exception in error response. (500) ', e);
		}
	};
	
	function dispatch(request, response) {
		try {
			var uri = url.parse(request.url);
			if (!filter(request, response, uri))
				handlers[""](request, response, uri);
		} catch ( e ) {
			console.log('Server error.', e);
		}
	}

	function filter(request, response, uri) {
		for(var prop in callbacks) {
			if(callbacks.hasOwnProperty(prop)
			&& uri.pathname.length + 1 >= prop.length 
			&& uri.pathname.substr(1, prop.length) === prop) {
				callbacks[prop](request, response, uri);
				return true;
			}
		}
		return false;
	}
	
	function write (response, body, status, headers) {
		response.writeHead(status, headers);
		if (body) {
			response.write(body);
		}
		response.end();
	};
	
	return {
		get callbacks() {
			return callbacks;
		},
		set callbacks(value) {
			callbacks = value;
		},
		get handlers() {
			return handlers;
		},
		set handlers(value) {
			handlers = value;
		},
		get indexfile() {
			return indexfile;
		},
		set indexfile(value) {
			indexfile = value;
		},
		get mimetypes() {
			return mimetypes;
		},
		set mimetypes(value) {
			mimetypes = value;
		},
		get root() {
			return root;
		},
		set root(value) {
			root = value;
		},
		listen: function() {
			server = http.createServer(dispatch);
			return server.listen.apply(server, arguments);
		},
		write: write,
		writeHTML: function (response, html) {
			write(response, html, 200, {"Content-Type": "text/html" });
		},
		writeJSON: function (response, json) {
			write(response, JSON.stringify(json), 200, {"Content-Type": "application/json"});
		},
		writeText: function (response, text) {
			write(response, text, 200, {"Content-Type": "text/plain"});
		}
	};
};

module.exports = ServerFactory;
