#require './packets/tcp'

class UDP
  def initialize packet
    @src, @dest, @length, @sum = packet.unpack('nnnn')
    
    raise "UDP packet invalid length" if @length != packet.size
    @data = packet[8..-1]
  end
end

