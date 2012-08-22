require 'pty'
require 'open3'
require 'io/console' # for IO#raw!

require './packets/radiotap'

m, s = PTY.open
s.raw!
stdin, stdout, dumpcap = Open3.popen2e("dumpcap", "-i", ARGV[0] || "mon0", "-q", "-p", "-w", s.path)
stdout.gets # wait for file to be opened
s.close

#m = File.open('/tmp/wireshark_wlan0_20120822001315_pvoOKL', 'r')

magic, major, minor, thiszone, sigfigs, snaplen, network = m.read(24).unpack('VvvVVVV')

raise 'Bad magic' if magic != 2712847316
raise 'Wrong pcap version' if major != 2 || minor != 4

waiter = Thread.new{ gets }
while waiter.alive?
  sec, usec, snarfed, length = m.read(16).unpack('VVVV')
  packet = m.read(snarfed)
  
  Radiotap.run packet
end

`kill #{dumpcap.pid}`
puts stdout.gets.strip
puts stdout.gets.strip
