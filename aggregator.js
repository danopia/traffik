var amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});
    
var tx    = 0,
    rx    = 0,
    
    macs  = {},
    ips   = {},
    ports = {};

conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  exchange.on('open', function () {
    setInterval(function () {
      exchange.publish('tally', JSON.stringify({tx: tx, rx: rx, macs: macs, ips: ips, ports: ports}));

      macs  = {};
      ips   = {};
      ports = {};
      
      tx    = 0;
      rx    = 0;
    }, 250);
    
    conn.queue('traffik aggregator', {autoDelete: false}, function (queue) {
      queue.bind(exchange, 'raw');
      
      queue.subscribe({ack: true, prefetchCount: 5}, function (message) {
        var json = JSON.parse(message.data.toString('utf8'));
        
        macs = json.macs;
        tx += json.tx;
        rx += json.rx;
        
        queue.shift();
      });
    });
  });
});
