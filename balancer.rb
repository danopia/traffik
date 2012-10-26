require 'pty'
require 'open3'
require 'io/console' # for IO#raw!

$logsrc = Open3.popen2('node', 'log.js', 'source', 'balancer')[0]
def log line, src=nil; $logsrc.puts [line, src, Time.now.strftime('%H:%M:%S')].join("\t"); end

match = `ip addr show scope global`.match(/((?:[0-9]+\.){3}[0-9]+)\/([0-9]+)/)
intra = if match
  ip, bits = match.captures
  ip.split('.')[0, bits.to_i / 8].join('.')
else
  log 'Unable to determine the intranet range'
  '0.0.0.0'
end

workers = 4.times.map do |i|
  proc = Open3.popen2('node', 'parser.js', intra)
  Thread.new do
    while line = proc[1].gets
      log line.chomp, "worker.#{i+1}"
    end
  end
  proc
end
streams = workers.map(&:first)
#streams.each(&:binmode)

m, s = PTY.open
s.raw!
stdin, stdout, dumpcap = Open3.popen2e("dumpcap", "-i", ARGV[0] || "wlan0", "-q", "-p", "-w", s.path)
stdout.gets # wait for file to be opened
s.close

i = -1
waiter = Thread.new { gets }

magic, major, minor, thiszone, sigfigs, snaplen, network = m.sysread(24).unpack('VvvVVVV')

raise 'Bad magic' if magic != 2712847316
raise 'Wrong pcap version' if major != 2 || minor != 4

log 'All systems go'

buff = ''
buffer = ''
chunk = ''.force_encoding('ASCII-8BIT')
lastWork = Time.now
begin
  while waiter.alive?
    m.sysread(65535, chunk)
    buff << chunk;
    
    while (ss = buff.size) > 16 && ss > (len = buff.unpack('@8V').first+16) # unpack: reads one 32bit uint at position 8
      if buffer.size > 60000 || (Time.now - lastWork > 0.1)
        i=(i.succ)%4
        streams[i].syswrite(buffer)
        buffer.replace buff[0, len]
        lastWork = Time.now
      else
        buffer << buff[0, len]
      end

      #buff.splice!(0, len, '') # rbx
      #buff.copy_from(buff, len, buff.length - len, 0); buff.num_bytes -= len # rbx again
      buff.replace(buff[len..-1]) # 1.9.3
    end
  end
rescue EOFError
  puts 'End of Feed'
end

streams.each(&:close)
`kill #{dumpcap.pid}`
puts stdout.gets.strip
puts stdout.gets.strip

$logsrc.close
