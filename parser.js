var amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});

var tx    = 0,
    rx    = 0,
    
    macs  = {},
    ips   = {},
    ports = {};

var handleTCP = function (buffer, length) {
  var src  = buffer.readUInt16BE(0);
  ports[src ] = ports[src ] || [0,0];
  ports[src ][0] += length;
  
  var dest = buffer.readUInt16BE(2);
  ports[dest] = ports[dest] || [0,0];
  ports[dest][1] += length;
};

var handleIP = function (buffer, length) {
  var src  = buffer.slice(12, 16).toString('hex');
  ips[src ] = ips[src ] || [0,0];
  ips[src ][0] += length;
  
  var dest = buffer.slice(16, 20).toString('hex');
  ips[dest] = ips[dest] || [0,0];
  ips[dest][1] += length;
  
  var proto = buffer.readUInt8(9);
  buffer = buffer.slice((buffer.readUInt8(0) & 0x0f) * 4);
  
  switch (proto) {
  case 1:
    console.log('Got ICMP packet');
    break;
    
  case 6:
    handleTCP(buffer, length);
    break;
    
  case 17:
    console.log('Got UDP packet');
    break;
  
  default:
    // http://www.networksorcery.com/enp/protocol/ip.htm
    console.log('Got unknown IP protocol', proto);
  };
};

var handleEther = function (buffer, length) {
  var src  = buffer.slice( 0,  6).toString('hex');
  macs[src ] = macs[src ] || [0,0];
  macs[src ][0] += length;
  
  var dest = buffer.slice( 6, 12).toString('hex');
  macs[dest] = macs[dest] || [0,0];
  macs[dest][1] += length;

  var proto = buffer.readUInt16BE(12);
  buffer = buffer.slice(14);
  
  switch (proto) {
  case 0x0800:
    handleIP(buffer, length);
    break;
  
  default:
    // http://www.networksorcery.com/enp/protocol/802/ethertypes.htm
    console.log('Got unknown ethertype:', proto.toString(16));
  };
};

// Wait for AMQP connection to become established.
conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  setInterval(function () {
    if (Object.keys(macs).length == 0) return;
    
    exchange.publish('raw', JSON.stringify({tx: tx, rx: rx, macs: macs, ips: ips, ports: ports}));

    macs  = {};
    ips   = {};
    ports = {};
  }, 100);
  
  process.stdin.resume();
  process.stdin.on('data', function (left) {
    while (left.length) {
      var sec    = left.readUInt32LE( 0),
          usec   = left.readUInt32LE( 4),
          caught = left.readUInt32LE( 8),
          length = left.readUInt32LE(12);

      var packet = left.slice(16, caught + 16);
      handleEther(packet, length);
      left = left.slice(caught + 16);
    };
  });
  
  process.stdin.on('end', function () {
    exchange.publish('raw', JSON.stringify({tx: tx, rx: rx, macs: macs, ips: ips, ports: ports}));
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
