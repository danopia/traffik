var amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});

conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  if (process.argv[2] == 'source') {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', function (line) {
      var lines = line.split('\n');
      for (var i = 0; i < lines.length - 1; i++) {
        var parts = lines[i].trim().split('\t');
        exchange.publish('log', JSON.stringify({
          timestamp: parts[2],
          source: (parts[1] && parts[1].length) ? parts[1] : process.argv[3],
          message: parts[0]
        }));
      };
    });
    
    process.stdin.on('end', function () {
      process.exit(0);
    });
  } else {
    exchange.on('open', function () {
      conn.queue('traffik log sink', function (queue) {
        queue.bind(exchange, 'log');
        console.log('Ready for action');
        
        queue.subscribe(function (message) {
          var data = JSON.parse(message.data.toString('utf8'));
          console.log('[' + data.timestamp + ']', '<' + data.source + '>', data.message);
        });
      });
    });
  };
});

