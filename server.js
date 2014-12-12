var mongo = require('mongodb').MongoClient,
	express = require('express'),
	app = express(),
	http = require('http'),
	server = http.createServer(app),
	client = require('socket.io').listen(server).sockets;

server.listen(8081);

app.get('/', function (req, res) {
res.sendfile(__dirname + '/index.html');
});

mongo.connect('mongodb://127.0.0.1/chat', function(err, db){
	if(err) throw err;
	client.on('connection', function(socket) {
		//wait for input
		var col = db.collection('messages'),
			sendStatus = function(s){
				socket.emit('status', s);
			};

		//Emit messages
		col.find().limit(100).sort({_id: 1}).toArray(function(err, res){
			if(err) throw err;
			socket.emit('init', res);
		});

		socket.on('input', function(data){
			var name = data.name,
				message = data.message,
				whitespacePattern = /^\s*$/;
			if (whitespacePattern.test(name) || whitespacePattern.test(message)) {
				sendStatus("Name and message is required.");
			} else {
				col.insert({name: name, message: message}, function(){
					//Emit lates message to ALL clients
					socket.broadcast.emit('output', [data]);
					sendStatus({
						message: "Message sent",
						clear: true
					});
				});
			}

			
		});
	});

});

//var socket = io.connect('http://127.0.0.1:8081');

