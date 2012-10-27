var amqp = require('amqp'),
    conn = amqp.createConnection({host: 'localhost'});

var tx    = 0,
    rx    = 0,
    
    macs  = {},
    ips   = {},
    ports = {},
    
    cache = {},
    intra = process.argv[2];

var decToHex = function (byte) {
  if (byte < 16)
    return '0' + Number(byte).toString(16);
  else
    return Number(byte).toString(16);
}
intra = intra.split('.').map(decToHex).join('');

var handleTCPUDP = function (buffer, length, proto) {
  var src  = buffer.readUInt16BE(0);
  ports[src ] = ports[src ] || [0,0];
  ports[src ][0] += length;
  
  var dest = buffer.readUInt16BE(2);
  ports[dest] = ports[dest] || [0,0];
  ports[dest][1] += length;
};

var handleARP = function (buffer, length, srcMac, destMac) { // src is ff.., dest is 00..
  if (buffer.readUInt16BE(0) != 0x0001)
    return console.log('Got non-Ethernet ARP packet -', buffer.readUInt16BE(0));
    
  if (buffer.readUInt16BE(2) != 0x0800)
    return console.log('Got non-IP ARP packet -', buffer.readUInt16BE(2));
  
  var macLen = buffer.readUInt8(4),
      ipLen  = buffer.readUInt8(5);
  
  if (macLen != 6 || ipLen != 4)
    return console.log('wtf mate', macLen, ipLen);
    
  var srcMac  = buffer.slice(8,  14).toString('hex');
  var srcIp   = buffer.slice(14, 18).toString('hex');
  ips[srcIp ] = ips[srcIp ] || [0,0];
  ips[srcIp ][0] += length;
  
  var destMac = buffer.slice(18, 24).toString('hex');
  var destIp  = buffer.slice(24, 28).toString('hex');
  ips[destIp] = ips[destIp] || [0,0];
  ips[destIp][1] += length;
    
  var opCode = buffer.readUInt16BE(6);
  
  switch (opCode) {
  case 1:
    //console.log('ARP request', 'from', srcMac, srcIp, 'to', destMac, destIp);
    break;
    
  case 2:
    console.log('ARP response', 'from', srcMac, srcIp, 'to', destMac, destIp);
    break;
  
  default:
    console.log('Got', length, 'length ARP packet', opCode);
  };
};

var handleIP = function (buffer, length, srcMac, destMac) {
  var src  = buffer.slice(12, 16).toString('hex');
  ips[src ] = ips[src ] || [0,0];
  ips[src ][0] += length;
  
  var dest = buffer.slice(16, 20).toString('hex');
  ips[dest] = ips[dest] || [0,0];
  ips[dest][1] += length;
  
  if      (cache[srcMac ] === undefined &&  src.indexOf(intra) === 0)
    cache[destMac] = !(cache[srcMac ] = true);
  else if (cache[destMac] === undefined && dest.indexOf(intra) === 0)
    cache[srcMac ] = !(cache[destMac] = true);
  
  var proto = buffer.readUInt8(9);
  buffer = buffer.slice((buffer.readUInt8(0) & 0x0f) * 4);
  
  switch (proto) {
  case 1:
    console.log('Got ICMP packet');
    break;
    
  case 6:
    handleTCPUDP(buffer, length, 'TCP');
    break;
    
  case 17:
    handleTCPUDP(buffer, length, 'UDP');
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
  
  if (cache[src] !== undefined && cache[dest] === undefined)
    cache[dest] = !cache[src ];
  else if (cache[src] === undefined && cache[dest] !== undefined)
    cache[src ] = !cache[dest];

  var proto = buffer.readUInt16BE(12);
  buffer = buffer.slice(14);
  
  switch (proto) {
  case 0x0800:
    handleIP(buffer, length, src, dest);
    break;
  
  case 0x0806:
    handleARP(buffer, length, src, dest);
    break;
    
  default:
    // http://www.networksorcery.com/enp/protocol/802/ethertypes.htm
    console.log('Got unknown ethertype:', proto.toString(16));
  };
  
  if (cache[src])
    tx += length;
  else if (cache[dest])
    rx += length;
};

// Wait for AMQP connection to become established.
conn.on('ready', function () {
  var exchange = conn.exchange('traffik');
  
  setInterval(function () {
    if (Object.keys(macs).length == 0) return;
    
    exchange.publish('raw', JSON.stringify({tx: tx, rx: rx, macs: macs, ips: ips, ports: ports, cache: cache.length}));

    macs  = {};
    ips   = {};
    ports = {};
    
    tx    = 0;
    rx    = 0;
  }, 100);
  
  process.stdin.resume();
  process.stdin.on('data', function (left) {
    while (left.length) {
      var sec    = left.readUInt32LE( 0),
          usec   = left.readUInt32LE( 4),
          caught = left.readUInt32LE( 8),
          length = left.readUInt32LE(12);

      if (caught + 16 > left.length) { console.log('Not enough packet'); }
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
