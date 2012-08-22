require './packets/tcp'

class IP
  def initialize packet
    raise 'invalid IP header' if packet.bytes.first != 0x45
    
    @length = packet[2, 2].unpack('v').first
    @ttl, @proto = packet[8, 2].unpack('CC')
    @src = packet[12, 4]
    @dest = packet[16, 4]
    
    if @proto == 6
      @inner = TCP.new packet[20..-1]
    else
      puts "IP protocol #{@proto} seen"
    end
  end
end

