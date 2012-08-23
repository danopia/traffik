#require 'pty'
require 'open3'
#require 'io/console' # for IO#raw!

workers = 4.times.map do
  Open3.popen2("node", "parser.rb.js")
end
streams = workers.map(&:first)
#streams.map(&:binmode)

#m, s = PTY.open
#s.raw!
#stdin, stdout, dumpcap = Open3.popen2e("dumpcap", "-i", ARGV[0] || "wlan0", "-q", "-p", "-w", s.path)
#stdout.gets # wait for file to be opened
#s.close

i=0
#waiter = Thread.new{ gets }
15.times do
#require 'profiler'
#profiler = Rubinius::Profiler::Instrumenter.new
#profiler.profile do
  m = File.open('/tmp/ram/wiresharkXXXXAgq7V0', 'r')
#m.binmode
  magic, major, minor, thiszone, sigfigs, snaplen, network = m.sysread(24).unpack('VvvVVVV')

  raise 'Bad magic' if magic != 2712847316
  raise 'Wrong pcap version' if major != 2 || minor != 4

  buff = ''
  buffer = ''
  chunk = ''.force_encoding('ASCII-8BIT')
  begin
    while m.sysread(65535, chunk)
      buff << chunk;
      
      while (ss = buff.size) > 16 && ss > (len = buff.unpack('@8V').first+16)
        if buffer.size > 60000
          i=(i.succ)%4
          streams[i].syswrite(buffer)
          buffer.replace buff[0, len]
        else
          buffer << buff[0, len]
        end

        #buff.splice!(0, len, '') # rbx
        #buff.copy_from(buff, len, buff.length - len, 0); buff.num_bytes -= len # rbx again
        buff.replace(buff[len..-1]) # 1.9.3
      end
    end
  rescue EOFError
  end
  
  m.close
end
#end

streams.map(&:close)
#`kill #{dumpcap.pid}`
#puts stdout.gets.strip
#puts stdout.gets.stripmr
