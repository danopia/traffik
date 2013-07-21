require 'pty'
require 'open3'
require 'io/console' # for IO#raw!

require './packets/radiotap'
require './packets/ethernet'

m, s = PTY.open
s.raw!
stdin, stdout, dumpcap = Open3.popen2e("dumpcap", "-i", ARGV[0] || "wlan0", "-P", "-q", "-p", "-w", s.path) # added -P
stdout.gets # wait for file to be opened
#s.close

magic, major, minor, thiszone, sigfigs, snaplen, network = m.read(24).unpack('VvvVVVV')

raise 'Bad magic' if magic != 2712847316
raise 'Wrong pcap version' if major != 2 || minor != 4

while !m.eof?
  sec, usec, snarfed, length = m.read(16).unpack('VVVV')
  packet = m.read(snarfed)
  
  packet = Ethernet.new(packet)
  #packet = Radiotap.new(packet)
  
  p packet
end

`kill #{dumpcap.pid}`
puts stdout.gets.strip
puts stdout.gets.strip
