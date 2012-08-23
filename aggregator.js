var amqp = require('amqp');

var connection = amqp.createConnection({ host: 'localhost' });

connection.on('ready', function () {
  connection.queue('traffik.raw', function(q){
    q.bind('#');

    q.subscribe(function (message) {
      console.log(JSON.parse(message.data.toString('utf8')));
    });
  });
});
