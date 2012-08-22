require 'pty'
require 'open3'
require 'io/console' # for IO#raw!

#m, s = PTY.open
#s.raw!
#stdin, stdout, dumpcap = Open3.popen2e("dumpcap", "-i", ARGV[0] || "wlan0", "-q", "-p", "-w", s.path)
#stdout.gets # wait for file to be opened
#s.close

m = File.open('wiresharkXXXXAgq7V0', 'r')

magic, major, minor, thiszone, sigfigs, snaplen, network = m.read(24).unpack('VvvVVVV')

raise 'Bad magic' if magic != 2712847316
raise 'Wrong pcap version' if major != 2 || minor != 4

t1=Time.now
i=0
waiter = Thread.new{ gets }
while waiter.alive? && !m.eof?
i+=1
  sec, usec, snarfed, length = m.read(16).unpack('VVVV')
  packet = m.read(snarfed)

  next if packet[12, 2] != "\x00\x08" # IP

  src = packet[26, 4]
  dest = packet[30, 4]
  #src = ips[0, 4].join('.')
  #dest = ips[4, 4].join('.')
  
  #packet = Ethernet.new(packet)
  #packet = Radiotap.new(packet)
  
  #p packet
end
t2=Time.now
td = t2-t1
bits=(91949361-16)*8
p i,bits.to_f/td/1024/1024

#`kill #{dumpcap.pid}`
#puts stdout.gets.strip
#puts stdout.gets.strip
