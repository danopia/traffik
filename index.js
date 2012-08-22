var fs = require('fs');

var stream = fs.openSync('wiresharkXXXXAgq7V0', 'r');

var gHeader = new Buffer(24);
fs.readSync(stream, gHeader, 0, 24, 0);

var t1=new Date();
var offset = 24;
try {
while (1) {
  var header = new Buffer(16);
  fs.readSync(stream, header, 0, 16, offset);
  offset += 16;

  var sec     = header.readUInt32LE( 0),
      usec    = header.readUInt32LE( 4),
      snarfed = header.readUInt32LE( 8),
      length  = header.readUInt32LE(12);
      
  var packet = new Buffer(snarfed);
  fs.readSync(stream, packet, 0, snarfed, 0);
  offset += snarfed;
  
  if (packet.readUInt16LE(12) != 8) // IP
    continue;

  var src  = packet.slice(26, 30),
      dest = packet.slice(30, 34);
}
} catch (e) { console.log(e); }

var t2=new Date();
var td = t2-t1;
var bits=(91949361-24)*8;
console.log(bits/td/1024);
