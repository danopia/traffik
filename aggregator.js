var amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});

conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  exchange.on('open', function () {
    conn.queue('traffik aggregator', {autoDelete: false}, function (queue) {
      queue.bind(exchange, 'raw');
      
      queue.subscribe({ack: true, prefetchCount: 5}, function (message) {
        console.log(JSON.parse(message.data.toString('utf8')));
        queue.shift();
      });
    });
  });
});
