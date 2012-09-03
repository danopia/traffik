var app = require('http').createServer(handler),
    io = require('socket.io').listen(app),
    fs = require('fs'),
    amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});
    

app.listen(80);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var sockets = [];
io.sockets.on('connection', function (socket) {
  sockets.push(socket);
  
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});



var tx    = 0,
    rx    = 0,
    
    macs  = {},
    ips   = {},
    ports = {};

conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  exchange.on('open', function () {
    conn.queue('', function (queue) {
      queue.bind(exchange, 'tally');
      
      queue.subscribe(function (message) {
        var json = JSON.parse(message.data.toString('utf8'));
        
        for (var i = 0; i < sockets.length; i++) {
          sockets[i].emit('tally', json);
        };
      });
    });
  });
});
