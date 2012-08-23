var amqp = require('amqp');

var connection = amqp.createConnection({ host: 'localhost' });

// Wait for connection to become established.
connection.on('ready', function () {
  var macs  = {},
      ips   = {},
      ports = {};

  setInterval(function () {
    connection.publish('traffik.raw', JSON.stringify({macs: macs, ips: ips, ports: ports}));

    macs  = {};
    ips   = {};
    ports = {};
  }, 100);
  
  process.stdin.resume();
  process.stdin.on('data', function (data) {
    var sec    = data.readUInt32LE( 0)/*,
        usec   = data.readUInt32LE( 4),
        caught = data.readUInt32LE( 8),
        length = data.readUInt32LE(12)*/;

    macs[0] = sec;
  });
  
  process.stdin.on('end', function () {
    connection.publish('traffik.raw', JSON.stringify({macs: macs, ips: ips, ports: ports}));
    process.exit(0);
  });
});


/*

  sec, usec, snarfed, length = STDIN.read(16).unpack('VVVV')
  packet = STDIN.read(snarfed)

  next if packet[12, 2] != "\x08\x00" # IP

  src = packet[26, 4]
  dest = packet[30, 4]
  src = src.unpack('C*').join('.')
  dest = dest.unpack('C*').join('.')
  #p src

  totals[packet[26,8]]+=length
  
  #packet = Ethernet.new(packet)
  #packet = Radiotap.new(packet)
  
  #p packet
end
*/
